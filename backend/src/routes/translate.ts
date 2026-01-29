import { Router, Request, Response, NextFunction } from 'express';
import type { Entry } from '@prisma/client';
import { prisma } from '../utils/db';
import { translateText, translateBatch } from '../services/openai';
import { AppError } from '../middleware/errorHandler';

export const translateRoutes = Router();

// Translate a single entry
translateRoutes.post('/single', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entryId, targetLanguage } = req.body;

    if (!entryId || !targetLanguage) {
      throw new AppError('entryId and targetLanguage are required', 400);
    }

    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new AppError('Entry not found', 404);
    }

    const translation = await translateText({
      text: entry.msgid,
      targetLanguage,
      context: entry.msgctxt || undefined,
    });

    // Save history
    await prisma.history.create({
      data: {
        projectId: entry.projectId,
        entryId: entry.id,
        msgid: entry.msgid,
        oldMsgstr: entry.msgstr,
        newMsgstr: [translation],
        changedBy: 'ChatGPT',
      },
    });

    // Update entry
    const updatedEntry = await prisma.entry.update({
      where: { id: entryId },
      data: {
        msgstr: [translation],
        isTranslated: true,
        isFuzzy: false,
      },
    });

    res.json({
      entry: updatedEntry,
      translation,
    });
  } catch (error) {
    next(error);
  }
});

// Translate multiple entries
translateRoutes.post('/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entryIds, targetLanguage } = req.body;

    if (!Array.isArray(entryIds) || !targetLanguage) {
      throw new AppError('entryIds array and targetLanguage are required', 400);
    }

    const entries = await prisma.entry.findMany({
      where: { id: { in: entryIds } },
    });

    if (entries.length === 0) {
      throw new AppError('No entries found', 404);
    }

    const toTranslate = entries.map((e: Entry) => ({
      id: e.id,
      text: e.msgid,
      context: e.msgctxt || undefined,
    }));

    const translations = await translateBatch(toTranslate, targetLanguage);

    const results = await Promise.all(
      translations.map(async ({ id, translation }) => {
        if (!translation) return null;

        const entry = entries.find((e: Entry) => e.id === id);
        if (!entry) return null;

        // Save history
        await prisma.history.create({
          data: {
            projectId: entry.projectId,
            entryId: id,
            msgid: entry.msgid,
            oldMsgstr: entry.msgstr,
            newMsgstr: [translation],
            changedBy: 'ChatGPT',
          },
        });

        return prisma.entry.update({
          where: { id },
          data: {
            msgstr: [translation],
            isTranslated: true,
            isFuzzy: false,
          },
        });
      })
    );

    res.json({
      translated: results.filter(Boolean).length,
      entries: results.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
});

// Translate all untranslated entries in a project
translateRoutes.post('/project/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { targetLanguage } = req.body;

    if (!targetLanguage) {
      throw new AppError('targetLanguage is required', 400);
    }

    const entries = await prisma.entry.findMany({
      where: {
        projectId,
        isTranslated: false,
      },
    });

    if (entries.length === 0) {
      return res.json({ translated: 0, message: 'No untranslated entries found' });
    }

    const toTranslate = entries.map((e: Entry) => ({
      id: e.id,
      text: e.msgid,
      context: e.msgctxt || undefined,
    }));

    const translations = await translateBatch(toTranslate, targetLanguage);

    const results = await Promise.all(
      translations.map(async ({ id, translation }) => {
        if (!translation) return null;

        const entry = entries.find((e: Entry) => e.id === id);
        if (!entry) return null;

        await prisma.history.create({
          data: {
            projectId: entry.projectId,
            entryId: id,
            msgid: entry.msgid,
            oldMsgstr: entry.msgstr,
            newMsgstr: [translation],
            changedBy: 'ChatGPT',
          },
        });

        return prisma.entry.update({
          where: { id },
          data: {
            msgstr: [translation],
            isTranslated: true,
            isFuzzy: false,
          },
        });
      })
    );

    res.json({
      translated: results.filter(Boolean).length,
      total: entries.length,
    });
  } catch (error) {
    next(error);
  }
});
