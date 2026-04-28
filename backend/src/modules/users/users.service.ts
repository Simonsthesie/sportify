import { prisma } from '../../config/prisma';
import { NotFound, BadRequest } from '../../utils/errors';
import { RoleLibelle } from '@prisma/client';

const safeUserSelect = {
  id: true,
  email: true,
  nom: true,
  prenom: true,
  creeLe: true,
  majLe: true,
  role: { select: { libelle: true } },
} as const;

export const usersService = {
  list() {
    return prisma.utilisateur.findMany({
      orderBy: { id: 'asc' },
      select: safeUserSelect,
    });
  },

  async getById(id: number) {
    const user = await prisma.utilisateur.findUnique({
      where: { id },
      select: safeUserSelect,
    });
    if (!user) throw NotFound('Utilisateur introuvable');
    return user;
  },

  async updateRole(id: number, libelle: RoleLibelle) {
    const role = await prisma.role.findUnique({ where: { libelle } });
    if (!role) throw BadRequest('Role inconnu');

    if (libelle === 'COACH') {
      const existingCoach = await prisma.coach.findUnique({ where: { utilisateurId: id } });
      if (!existingCoach) {
        await prisma.coach.create({
          data: { utilisateurId: id, specialite: 'A definir' },
        });
      }
    }

    return prisma.utilisateur.update({
      where: { id },
      data: { roleId: role.id },
      select: safeUserSelect,
    });
  },

  async remove(id: number) {
    const user = await prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw NotFound('Utilisateur introuvable');
    await prisma.utilisateur.delete({ where: { id } });
  },
};
