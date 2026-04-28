import { Request, Response, NextFunction } from 'express';
import { seancesService } from './seances.service';
import { BadRequest, Unauthorized } from '../../utils/errors';

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw BadRequest('Identifiant invalide');
  return id;
}

export const seancesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await seancesService.list(req.query as any));
    } catch (err) {
      next(err);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Unauthorized();
      res.json(await seancesService.listForCoach(req.user.sub));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await seancesService.getById(parseId(req.params.id)));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Unauthorized();
      const seance = await seancesService.create(req.user, req.body);
      res.status(201).json(seance);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Unauthorized();
      const seance = await seancesService.update(req.user, parseId(req.params.id), req.body);
      res.json(seance);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Unauthorized();
      await seancesService.remove(req.user, parseId(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async participants(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Unauthorized();
      res.json(await seancesService.listParticipants(req.user, parseId(req.params.id)));
    } catch (err) {
      next(err);
    }
  },
};
