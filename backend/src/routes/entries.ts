import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AppError } from '../middleware/errorHandler';

export const entryRoutes = Router();

// Get entries for a project with filtering
entryRoutes.get('/project/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { search, filter, page = '1', limit = '50' } = req.query;

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
    const { id } = req.params;
    const { msgstr, isFuzzy } = req.body;

    const existingEntry = await prisma.entry.findUnique({
      where: { id },
    });

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
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      throw new AppError('Updates must be an array', 400);
    }

    const results = await Promise.all(
      updates.map(async ({ id, msgstr }: { id: string; msgstr: string[] }) => {
        const existingEntry = await prisma.entry.findUnique({
          where: { id },
        });

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
    const { id } = req.params;

    const history = await prisma.history.findMany({
      where: { entryId: id },
      orderBy: { changedAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    next(error);
  }
});
