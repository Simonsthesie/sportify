import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticate, async (_req: Request, res: Response) => {
  const coaches = await prisma.coach.findMany({
    include: {
      utilisateur: { select: { id: true, nom: true, prenom: true, email: true } },
    },
    orderBy: { utilisateur: { nom: 'asc' } },
  });
  res.json(coaches.map((c) => ({
    id: c.id,
    specialite: c.specialite,
    bio: c.bio,
    utilisateur: c.utilisateur,
  })));
});

export default router;
