import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AppError } from '../middleware/errorHandler';

export const entryRoutes = Router();

// Helper to verify user owns the project
async function verifyProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  return !!project;
}

// Helper to verify user owns the entry
async function verifyEntryOwnership(entryId: string, userId: string) {
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: { project: true },
  });
  return entry && entry.project.userId === userId ? entry : null;
}

// Get entries for a project with filtering
entryRoutes.get('/project/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { projectId } = req.params;
    const { search, filter, page = '1', limit = '50' } = req.query;

    // Verify user owns the project
    if (!await verifyProjectOwnership(projectId, userId)) {
      throw new AppError('Project not found', 404);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { projectId };

    if (search) {
      where.OR = [
        { msgid: { contains: search as string, mode: 'insensitive' } },
        { msgstr: { hasSome: [search as string] } },
        { comments: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (filter === 'untranslated') {
      where.isTranslated = false;
    } else if (filter === 'translated') {
      where.isTranslated = true;
    } else if (filter === 'fuzzy') {
      where.isFuzzy = true;
    }

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.entry.count({ where }),
    ]);

    res.json({
      entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update a single entry
entryRoutes.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { msgstr, isFuzzy } = req.body;

    const existingEntry = await verifyEntryOwnership(id, userId);
    if (!existingEntry) {
      throw new AppError('Entry not found', 404);
    }

    // Save history
    if (msgstr && JSON.stringify(msgstr) !== JSON.stringify(existingEntry.msgstr)) {
      await prisma.history.create({
        data: {
          projectId: existingEntry.projectId,
          entryId: id,
          msgid: existingEntry.msgid,
          oldMsgstr: existingEntry.msgstr,
          newMsgstr: msgstr,
        },
      });
    }

    const isTranslated = Array.isArray(msgstr)
      ? msgstr.some((s: string) => s.length > 0)
      : existingEntry.isTranslated;

    const entry = await prisma.entry.update({
      where: { id },
      data: {
        ...(msgstr !== undefined && { msgstr }),
        ...(isFuzzy !== undefined && { isFuzzy }),
        isTranslated,
      },
    });

    // Update project timestamp
    await prisma.project.update({
      where: { id: entry.projectId },
      data: { updatedAt: new Date() },
    });

    res.json(entry);
  } catch (error) {
    next(error);
  }
});

// Batch update entries
entryRoutes.post('/batch-update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      throw new AppError('Updates must be an array', 400);
    }

    const results = await Promise.all(
      updates.map(async ({ id, msgstr }: { id: string; msgstr: string[] }) => {
        const existingEntry = await verifyEntryOwnership(id, userId);
        if (!existingEntry) return null;

        // Save history
        if (JSON.stringify(msgstr) !== JSON.stringify(existingEntry.msgstr)) {
          await prisma.history.create({
            data: {
              projectId: existingEntry.projectId,
              entryId: id,
              msgid: existingEntry.msgid,
              oldMsgstr: existingEntry.msgstr,
              newMsgstr: msgstr,
            },
          });
        }

        return prisma.entry.update({
          where: { id },
          data: {
            msgstr,
            isTranslated: msgstr.some((s) => s.length > 0),
          },
        });
      })
    );

    res.json(results.filter(Boolean));
  } catch (error) {
    next(error);
  }
});

// Get entry history
entryRoutes.get('/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const entry = await verifyEntryOwnership(id, userId);
    if (!entry) {
      throw new AppError('Entry not found', 404);
    }

    const history = await prisma.history.findMany({
      where: { entryId: id },
      orderBy: { changedAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Undo - revert to previous translation
entryRoutes.post('/:id/undo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const entry = await verifyEntryOwnership(id, userId);
    if (!entry) {
      throw new AppError('Entry not found', 404);
    }

    // Get the most recent history entry for this entry
    const lastHistory = await prisma.history.findFirst({
      where: { entryId: id },
      orderBy: { changedAt: 'desc' },
    });

    if (!lastHistory) {
      throw new AppError('No history to undo', 400);
    }

    // Create a new history entry for the undo action (so we can redo)
    await prisma.history.create({
      data: {
        projectId: entry.projectId,
        entryId: id,
        msgid: entry.msgid,
        oldMsgstr: entry.msgstr,
        newMsgstr: lastHistory.oldMsgstr,
        changedBy: 'undo',
      },
    });

    // Update the entry with the old value
    const updatedEntry = await prisma.entry.update({
      where: { id },
      data: {
        msgstr: lastHistory.oldMsgstr,
        isTranslated: lastHistory.oldMsgstr.some((s: string) => s.length > 0),
      },
    });

    res.json({
      entry: updatedEntry,
      undone: lastHistory,
    });
  } catch (error) {
    next(error);
  }
});

// Restore to a specific history state
entryRoutes.post('/:id/restore/:historyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id, historyId } = req.params;

    const entry = await verifyEntryOwnership(id, userId);
    if (!entry) {
      throw new AppError('Entry not found', 404);
    }

    const historyEntry = await prisma.history.findUnique({
      where: { id: historyId },
    });

    if (!historyEntry || historyEntry.entryId !== id) {
      throw new AppError('History entry not found', 404);
    }

    // Save current state to history before restoring
    await prisma.history.create({
      data: {
        projectId: entry.projectId,
        entryId: id,
        msgid: entry.msgid,
        oldMsgstr: entry.msgstr,
        newMsgstr: historyEntry.oldMsgstr,
        changedBy: 'restore',
      },
    });

    // Restore to the old value from that history entry
    const updatedEntry = await prisma.entry.update({
      where: { id },
      data: {
        msgstr: historyEntry.oldMsgstr,
        isTranslated: historyEntry.oldMsgstr.some((s: string) => s.length > 0),
      },
    });

    res.json({
      entry: updatedEntry,
      restoredFrom: historyEntry,
    });
  } catch (error) {
    next(error);
  }
});
