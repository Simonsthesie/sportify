import { prisma } from '../../config/prisma';
import { BadRequest, Conflict, Forbidden, NotFound } from '../../utils/errors';
import { JwtPayload } from '../../utils/jwt';
import { StatutReservation } from '@prisma/client';

const reservationInclude = {
  seance: {
    include: {
      coach: {
        include: {
          utilisateur: { select: { id: true, nom: true, prenom: true, email: true } },
        },
      },
    },
  },
  client: { select: { id: true, nom: true, prenom: true, email: true } },
} as const;

export const reservationsService = {
  async listForCurrent(user: JwtPayload) {
    return prisma.reservation.findMany({
      where: { clientId: user.sub },
      orderBy: { creeLe: 'desc' },
      include: reservationInclude,
    });
  },

  async listAll() {
    return prisma.reservation.findMany({
      orderBy: { creeLe: 'desc' },
      include: reservationInclude,
    });
  },

  async create(user: JwtPayload, seanceId: number) {
    const seance = await prisma.seance.findUnique({ where: { id: seanceId } });
    if (!seance) throw NotFound('Seance introuvable');

    if (seance.dateDebut.getTime() < Date.now()) {
      throw BadRequest('Impossible de reserver une seance deja commencee');
    }

    const existing = await prisma.reservation.findUnique({
      where: { uq_client_seance: { clientId: user.sub, seanceId } },
    });
    if (existing) {
      if (existing.statut === StatutReservation.CONFIRMEE) {
        throw Conflict('Vous avez deja une reservation pour cette seance');
      }
      // Ancienne annulation : on va reactiver apres verifications
    }

    const placesPrises = await prisma.reservation.count({
      where: { seanceId, statut: StatutReservation.CONFIRMEE },
    });
    if (placesPrises >= seance.capaciteMax) {
      throw Conflict('Seance complete');
    }

    const overlap = await prisma.reservation.findFirst({
      where: {
        clientId: user.sub,
        statut: StatutReservation.CONFIRMEE,
        seance: {
          dateDebut: { lt: seance.dateFin },
          dateFin: { gt: seance.dateDebut },
        },
      },
      include: { seance: true },
    });
    if (overlap) {
      throw Conflict('Vous avez deja une reservation sur ce creneau (seance "' + overlap.seance.titre + '")');
    }

    if (existing) {
      return prisma.reservation.update({
        where: { id: existing.id },
        data: { statut: StatutReservation.CONFIRMEE },
        include: reservationInclude,
      });
    }

    return prisma.reservation.create({
      data: {
        clientId: user.sub,
        seanceId,
        statut: StatutReservation.CONFIRMEE,
      },
      include: reservationInclude,
    });
  },

  async cancel(user: JwtPayload, reservationId: number) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw NotFound('Reservation introuvable');

    if (user.role !== 'ADMIN' && reservation.clientId !== user.sub) {
      throw Forbidden('Vous ne pouvez annuler que vos propres reservations');
    }

    if (reservation.statut === StatutReservation.ANNULEE) {
      return reservation;
    }

    return prisma.reservation.update({
      where: { id: reservationId },
      data: { statut: StatutReservation.ANNULEE },
    });
  },
};
