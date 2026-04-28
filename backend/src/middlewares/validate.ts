import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequest } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(BadRequest('Donnees invalides', result.error.flatten()));
    }
    (req as any)[source] = result.data;
    return next();
  };
}
