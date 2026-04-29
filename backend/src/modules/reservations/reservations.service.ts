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
    const seance = await prisma.seance.findUnique({
      where: { id: seanceId },
      include: { coach: { include: { utilisateur: true } } },
    });
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
    }

    const placesPrises = await prisma.reservation.count({
      where: { seanceId, statut: StatutReservation.CONFIRMEE },
    });
    if (placesPrises >= seance.capaciteMax) {
      throw Conflict('Seance complete - utilisez la liste d\'attente');
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

    const client = await prisma.utilisateur.findUnique({ where: { id: user.sub } });
    const clientNom = client ? `${client.prenom} ${client.nom}` : 'Un client';

    let result;
    if (existing) {
      result = await prisma.reservation.update({
        where: { id: existing.id },
        data: { statut: StatutReservation.CONFIRMEE },
        include: reservationInclude,
      });
    } else {
      result = await prisma.reservation.create({
        data: { clientId: user.sub, seanceId, statut: StatutReservation.CONFIRMEE },
        include: reservationInclude,
      });
    }

    // Notifier le coach
    await prisma.notification.create({
      data: {
        userId: seance.coach.utilisateurId,
        message: `${clientNom} a reserve votre seance "${seance.titre}". (${placesPrises + 1}/${seance.capaciteMax} places)`,
      },
    });

    return result;
  },

  async cancel(user: JwtPayload, reservationId: number) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        seance: { include: { coach: true } },
        client: { select: { id: true, nom: true, prenom: true } },
      },
    });
    if (!reservation) throw NotFound('Reservation introuvable');

    if (user.role !== 'ADMIN' && reservation.clientId !== user.sub) {
      throw Forbidden('Vous ne pouvez annuler que vos propres reservations');
    }

    if (reservation.statut === StatutReservation.ANNULEE) {
      return reservation;
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { statut: StatutReservation.ANNULEE },
    });

    const clientNom = `${reservation.client.prenom} ${reservation.client.nom}`;

    // Notifier le coach de l'annulation
    await prisma.notification.create({
      data: {
        userId: reservation.seance.coach.utilisateurId,
        message: `${clientNom} a annule sa reservation pour votre seance "${reservation.seance.titre}".`,
      },
    });

    // Promouvoir la premiere personne de la liste d'attente
    const premier = await prisma.listeAttente.findFirst({
      where: { seanceId: reservation.seanceId },
      orderBy: { position: 'asc' },
      include: { seance: true },
    });

    if (premier) {
      await prisma.listeAttente.delete({ where: { id: premier.id } });

      // Reordonner les positions
      await prisma.$executeRaw`
        UPDATE liste_attente SET position = position - 1
        WHERE seance_id = ${reservation.seanceId} AND position > ${premier.position}
      `;

      // Creer ou reactiver la reservation
      const existingResa = await prisma.reservation.findUnique({
        where: { uq_client_seance: { clientId: premier.clientId, seanceId: reservation.seanceId } },
      });

      if (existingResa) {
        await prisma.reservation.update({
          where: { id: existingResa.id },
          data: { statut: StatutReservation.CONFIRMEE },
        });
      } else {
        await prisma.reservation.create({
          data: { clientId: premier.clientId, seanceId: reservation.seanceId, statut: StatutReservation.CONFIRMEE },
        });
      }

      // Notifier le client promu
      await prisma.notification.create({
        data: {
          userId: premier.clientId,
          message: `Une place s'est liberee ! Votre reservation pour "${premier.seance.titre}" est confirmee.`,
        },
      });
    }

    return prisma.reservation.findUnique({
      where: { id: reservationId },
      include: reservationInclude,
    });
  },

  // Liste d'attente
  async joinWaitingList(user: JwtPayload, seanceId: number) {
    const seance = await prisma.seance.findUnique({ where: { id: seanceId } });
    if (!seance) throw NotFound('Seance introuvable');

    if (seance.dateDebut.getTime() < Date.now()) {
      throw BadRequest('Impossible de rejoindre la liste d\'attente d\'une seance passee');
    }

    const placesPrises = await prisma.reservation.count({
      where: { seanceId, statut: StatutReservation.CONFIRMEE },
    });
    if (placesPrises < seance.capaciteMax) {
      throw BadRequest('Des places sont disponibles - reservez directement');
    }

    const existing = await prisma.listeAttente.findUnique({
      where: { uq_attente_client_seance: { clientId: user.sub, seanceId } },
    });
    if (existing) throw Conflict('Vous etes deja dans la liste d\'attente');

    const alreadyConfirmed = await prisma.reservation.findUnique({
      where: { uq_client_seance: { clientId: user.sub, seanceId } },
    });
    if (alreadyConfirmed?.statut === StatutReservation.CONFIRMEE) {
      throw Conflict('Vous avez deja une reservation confirmee pour cette seance');
    }

    const lastPosition = await prisma.listeAttente.count({ where: { seanceId } });

    return prisma.listeAttente.create({
      data: { clientId: user.sub, seanceId, position: lastPosition + 1 },
    });
  },

  async leaveWaitingList(user: JwtPayload, seanceId: number) {
    const entry = await prisma.listeAttente.findUnique({
      where: { uq_attente_client_seance: { clientId: user.sub, seanceId } },
    });
    if (!entry) throw NotFound('Vous n\'etes pas dans la liste d\'attente');

    await prisma.listeAttente.delete({ where: { id: entry.id } });

    await prisma.$executeRaw`
      UPDATE liste_attente SET position = position - 1
      WHERE seance_id = ${seanceId} AND position > ${entry.position}
    `;

    return { success: true };
  },

  async getWaitingListPosition(user: JwtPayload, seanceId: number) {
    const entry = await prisma.listeAttente.findUnique({
      where: { uq_attente_client_seance: { clientId: user.sub, seanceId } },
    });
    if (!entry) return null;
    return entry.position;
  },

  async listWaitingForSeance(seanceId: number) {
    return prisma.listeAttente.findMany({
      where: { seanceId },
      orderBy: { position: 'asc' },
      include: {
        client: { select: { id: true, nom: true, prenom: true, email: true } },
      },
    });
  },
};
