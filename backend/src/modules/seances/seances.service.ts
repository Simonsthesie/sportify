import { prisma } from '../../config/prisma';
import { BadRequest, Forbidden, NotFound } from '../../utils/errors';
import { JwtPayload } from '../../utils/jwt';
import { CreateSeanceInput, UpdateSeanceInput, ListSeancesQuery } from './seances.validators';
import { StatutReservation } from '@prisma/client';

const seanceInclude = {
  coach: {
    include: {
      utilisateur: { select: { id: true, nom: true, prenom: true, email: true } },
    },
  },
  _count: {
    select: {
      reservations: { where: { statut: StatutReservation.CONFIRMEE } },
    },
  },
} as const;

function format(seance: any) {
  if (!seance) return seance;
  const placesPrises = seance._count?.reservations ?? 0;
  return {
    id: seance.id,
    titre: seance.titre,
    description: seance.description,
    dateDebut: seance.dateDebut,
    dateFin: seance.dateFin,
    capaciteMax: seance.capaciteMax,
    lieu: seance.lieu,
    coach: seance.coach
      ? {
          id: seance.coach.id,
          specialite: seance.coach.specialite,
          bio: seance.coach.bio,
          utilisateur: seance.coach.utilisateur,
        }
      : null,
    placesPrises,
    placesRestantes: Math.max(0, seance.capaciteMax - placesPrises),
    creeLe: seance.creeLe,
    majLe: seance.majLe,
  };
}

async function resolveCoachIdForCurrentUser(user: JwtPayload, requested?: number): Promise<number> {
  if (user.role === 'ADMIN') {
    if (!requested) throw BadRequest('coachId est requis pour un admin');
    const coach = await prisma.coach.findUnique({ where: { id: requested } });
    if (!coach) throw BadRequest('coachId invalide');
    return coach.id;
  }
  if (user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { utilisateurId: user.sub } });
    if (!coach) throw Forbidden('Profil coach introuvable');
    return coach.id;
  }
  throw Forbidden('Role insuffisant');
}

export const seancesService = {
  async list(query: ListSeancesQuery = { page: 1, limit: 20 }) {
    const { q, coachId, lieu, dateFrom, dateTo, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (coachId) where.coachId = coachId;
    if (lieu) where.lieu = { contains: lieu };
    if (q) {
      where.OR = [
        { titre: { contains: q } },
        { description: { contains: q } },
        { lieu: { contains: q } },
      ];
    }
    if (dateFrom || dateTo) {
      where.dateDebut = {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      };
    }

    const [seances, total] = await Promise.all([
      prisma.seance.findMany({
        where,
        orderBy: { dateDebut: 'asc' },
        skip,
        take: limit,
        include: seanceInclude,
      }),
      prisma.seance.count({ where }),
    ]);

    return {
      data: seances.map(format),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async listForCoach(userId: number) {
    const coach = await prisma.coach.findUnique({ where: { utilisateurId: userId } });
    if (!coach) throw NotFound('Profil coach introuvable');
    const seances = await prisma.seance.findMany({
      where: { coachId: coach.id },
      orderBy: { dateDebut: 'asc' },
      include: seanceInclude,
    });
    return seances.map(format);
  },

  async getById(id: number) {
    const seance = await prisma.seance.findUnique({ where: { id }, include: seanceInclude });
    if (!seance) throw NotFound('Seance introuvable');
    return format(seance);
  },

  async create(user: JwtPayload, input: CreateSeanceInput) {
    const coachId = await resolveCoachIdForCurrentUser(user, input.coachId);

    const seance = await prisma.seance.create({
      data: {
        titre: input.titre,
        description: input.description,
        dateDebut: input.dateDebut,
        dateFin: input.dateFin,
        capaciteMax: input.capaciteMax,
        lieu: input.lieu,
        coachId,
      },
      include: seanceInclude,
    });
    return format(seance);
  },

  async update(user: JwtPayload, id: number, input: UpdateSeanceInput) {
    const seance = await prisma.seance.findUnique({
      where: { id },
      include: { coach: true },
    });
    if (!seance) throw NotFound('Seance introuvable');

    if (user.role === 'COACH' && seance.coach.utilisateurId !== user.sub) {
      throw Forbidden('Vous n etes pas le coach de cette seance');
    }
    if (user.role === 'CLIENT') throw Forbidden();

    if (input.capaciteMax !== undefined) {
      const confirmees = await prisma.reservation.count({
        where: { seanceId: id, statut: StatutReservation.CONFIRMEE },
      });
      if (input.capaciteMax < confirmees) {
        throw BadRequest('La nouvelle capacite (' + input.capaciteMax + ') est inferieure au nombre de reservations deja confirmees (' + confirmees + ').');
      }
    }

    const updated = await prisma.seance.update({
      where: { id },
      data: input,
      include: seanceInclude,
    });
    return format(updated);
  },

  async remove(user: JwtPayload, id: number) {
    const seance = await prisma.seance.findUnique({
      where: { id },
      include: { coach: true },
    });
    if (!seance) throw NotFound('Seance introuvable');

    if (user.role === 'COACH' && seance.coach.utilisateurId !== user.sub) {
      throw Forbidden('Vous n etes pas le coach de cette seance');
    }
    if (user.role === 'CLIENT') throw Forbidden();

    await prisma.seance.delete({ where: { id } });
  },

  async listParticipants(user: JwtPayload, id: number) {
    const seance = await prisma.seance.findUnique({
      where: { id },
      include: { coach: true },
    });
    if (!seance) throw NotFound('Seance introuvable');
    if (user.role === 'COACH' && seance.coach.utilisateurId !== user.sub) {
      throw Forbidden('Vous n etes pas le coach de cette seance');
    }
    if (user.role === 'CLIENT') throw Forbidden();

    return prisma.reservation.findMany({
      where: { seanceId: id, statut: StatutReservation.CONFIRMEE },
      include: {
        client: { select: { id: true, nom: true, prenom: true, email: true } },
      },
      orderBy: { creeLe: 'asc' },
    });
  },
};
