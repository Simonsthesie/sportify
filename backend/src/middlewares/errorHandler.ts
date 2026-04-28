import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Route introuvable' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }
  if (err instanceof Error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[ERREUR]', err);
    }
    res.status(500).json({ message: 'Erreur interne du serveur' });
    return;
  }
  res.status(500).json({ message: 'Erreur interne du serveur' });
}
