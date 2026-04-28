import { Request, Response, NextFunction } from 'express';
import { reservationsService } from './reservations.service';
import { BadRequest, Unauthorized } from '../../utils/errors';

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw BadRequest('Identifiant invalide');
  return id;
}

export const reservationsController = {
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Unauthorized();
      res.json(await reservationsService.listForCurrent(req.user));
    } catch (err) {
      next(err);
    }
  },

  async listAll(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await reservationsService.listAll());
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Unauthorized();
      const reservation = await reservationsService.create(req.user, req.body.seanceId);
      res.status(201).json(reservation);
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Unauthorized();
      const reservation = await reservationsService.cancel(req.user, parseId(req.params.id));
      res.json(reservation);
    } catch (err) {
      next(err);
    }
  },
};
