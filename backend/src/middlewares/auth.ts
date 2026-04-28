import { Request, Response, NextFunction } from 'express';
import { JwtPayload, verifyToken } from '../utils/jwt';
import { Forbidden, Unauthorized } from '../utils/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(Unauthorized('Token manquant'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(Unauthorized('Token invalide ou expire'));
  }
}

type Role = JwtPayload['role'];

export function authorize(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(Unauthorized());
    }
    if (!allowed.includes(req.user.role)) {
      return next(Forbidden('Role insuffisant'));
    }
    return next();
  };
}
