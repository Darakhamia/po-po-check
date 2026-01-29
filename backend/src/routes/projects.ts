import { Router, Request, Response, NextFunction } from 'express';
import { UploadedFile } from 'express-fileupload';
import { prisma } from '../utils/db';
import { parsePOFile, extractEntries, buildPOFile, compilePOFile, POEntry } from '../services/poParser';
import { AppError } from '../middleware/errorHandler';

export const projectRoutes = Router();

// Get all projects
projectRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const translatedCount = await prisma.entry.count({
          where: { projectId: project.id, isTranslated: true },
        });
        return {
          ...project,
          totalEntries: project._count.entries,
          translatedEntries: translatedCount,
        };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    next(error);
  }
});

// Get single project
projectRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        entries: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Upload and create project from PO file
projectRoutes.post('/upload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !req.files.file) {
      throw new AppError('No file uploaded', 400);
    }

    const file = req.files.file as UploadedFile;
    const poFile = parsePOFile(file.data);
    const entries = extractEntries(poFile);

    const projectName = req.body.name || file.name.replace('.po', '');
    const language = poFile.headers['Language'] || req.body.language || null;

    const project = await prisma.project.create({
      data: {
        name: projectName,
        filename: file.name,
        language,
        entries: {
          create: entries.map((entry) => ({
            msgid: entry.msgid,
            msgidPlural: entry.msgidPlural,
            msgstr: entry.msgstr,
            msgctxt: entry.msgctxt,
            comments: entry.comments?.translator || entry.comments?.extracted,
            reference: entry.comments?.reference,
            flags: entry.comments?.flag ? entry.comments.flag.split(',').map((f) => f.trim()) : [],
            isTranslated: entry.msgstr.some((s) => s.length > 0),
            isFuzzy: entry.comments?.flag?.includes('fuzzy') || false,
          })),
        },
      },
      include: {
        entries: true,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// Export project to PO file
projectRoutes.get('/:id/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        entries: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const poEntries: POEntry[] = project.entries.map((entry) => ({
      msgid: entry.msgid,
      msgidPlural: entry.msgidPlural || undefined,
      msgstr: entry.msgstr,
      msgctxt: entry.msgctxt || undefined,
      comments: {
        translator: entry.comments || undefined,
        reference: entry.reference || undefined,
        flag: entry.flags.length > 0 ? entry.flags.join(', ') : undefined,
      },
    }));

    const headers: Record<string, string> = {};
    if (project.language) {
      headers['Language'] = project.language;
    }

    const poFile = buildPOFile(poEntries, headers);
    const buffer = compilePOFile(poFile);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${project.filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Delete project
projectRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Update project metadata
projectRoutes.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, language } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(language && { language }),
      },
    });

    res.json(project);
  } catch (error) {
    next(error);
  }
});
