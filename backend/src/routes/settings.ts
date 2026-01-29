import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AppError } from '../middleware/errorHandler';

export const settingsRoutes = Router();

// Get user settings
settingsRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return res.json({
        openaiApiKey: null,
        openaiApiKeyConfigured: false,
      });
    }

    res.json({
      openaiApiKey: settings.openaiApiKey
        ? settings.openaiApiKey.substring(0, 7) + '...' + settings.openaiApiKey.substring(settings.openaiApiKey.length - 4)
        : null,
      openaiApiKeyConfigured: !!settings.openaiApiKey,
    });
  } catch (error) {
    next(error);
  }
});

// Update OpenAI API key
settingsRoutes.put('/openai-api-key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { value } = req.body;

    if (value === undefined) {
      throw new AppError('value is required', 400);
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: { openaiApiKey: value || null },
      create: { userId, openaiApiKey: value || null },
    });

    res.json({
      openaiApiKey: settings.openaiApiKey
        ? settings.openaiApiKey.substring(0, 7) + '...' + settings.openaiApiKey.substring(settings.openaiApiKey.length - 4)
        : null,
      openaiApiKeyConfigured: !!settings.openaiApiKey,
    });
  } catch (error) {
    next(error);
  }
});

// Check if API key is configured
settingsRoutes.get('/api-key-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    res.json({
      configured: !!settings?.openaiApiKey,
      source: settings?.openaiApiKey ? 'user' : 'none',
    });
  } catch (error) {
    next(error);
  }
});
