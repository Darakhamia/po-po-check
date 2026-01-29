import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { resetOpenAIClient } from '../services/openai';
import { AppError } from '../middleware/errorHandler';

export const settingsRoutes = Router();

// Get all settings (without exposing full API key)
settingsRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.settings.findMany();

    const safeSettings = settings.map((s) => {
      if (s.key === 'openai_api_key' && s.value) {
        return {
          ...s,
          value: s.value.substring(0, 7) + '...' + s.value.substring(s.value.length - 4),
        };
      }
      return s;
    });

    res.json(safeSettings);
  } catch (error) {
    next(error);
  }
});

// Update a setting
settingsRoutes.put('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      throw new AppError('value is required', 400);
    }

    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Reset OpenAI client if API key was updated
    if (key === 'openai_api_key') {
      resetOpenAIClient();
    }

    // Return safe version
    if (key === 'openai_api_key' && value) {
      return res.json({
        ...setting,
        value: value.substring(0, 7) + '...' + value.substring(value.length - 4),
      });
    }

    res.json(setting);
  } catch (error) {
    next(error);
  }
});

// Check if API key is configured
settingsRoutes.get('/api-key-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'openai_api_key' },
    });

    const envKey = process.env.OPENAI_API_KEY;

    res.json({
      configured: !!(setting?.value || envKey),
      source: setting?.value ? 'database' : envKey ? 'environment' : 'none',
    });
  } catch (error) {
    next(error);
  }
});
