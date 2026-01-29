import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include auth
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Middleware to extract userId from Clerk auth
export const extractUserId = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  if (auth?.userId) {
    req.userId = auth.userId;
  }
  next();
};

// Export Clerk middlewares
export { clerkMiddleware, requireAuth };
