import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import path from 'path';
import { clerkMiddleware, requireAuth, extractUserId } from './middleware/auth';
import { projectRoutes } from './routes/projects';
import { entryRoutes } from './routes/entries';
import { translateRoutes } from './routes/translate';
import { settingsRoutes } from './routes/settings';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './utils/db';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  abortOnLimit: true,
}));

// Clerk middleware - parses auth from request
app.use(clerkMiddleware());

// Health check - no auth required
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes - require authentication
app.use('/api/projects', requireAuth(), extractUserId, projectRoutes);
app.use('/api/entries', requireAuth(), extractUserId, entryRoutes);
app.use('/api/translate', requireAuth(), extractUserId, translateRoutes);
app.use('/api/settings', requireAuth(), extractUserId, settingsRoutes);

app.use(errorHandler);

// Serve frontend static files
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

async function startServer() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
