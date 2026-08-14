import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET ?? 'taskflow-development-secret';
export interface AuthRequest extends Request { userId?: string; }
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try { req.userId = String((jwt.verify(token, secret) as jwt.JwtPayload).sub); next(); } catch { return res.status(401).json({ message: 'Invalid token' }); }
}
