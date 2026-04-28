import { prisma } from '../../config/prisma';
import { signToken } from '../../utils/jwt';
import { comparePassword, hashPassword } from '../../utils/password';
import { Conflict, Unauthorized } from '../../utils/errors';
import type { LoginInput, RegisterInput } from './auth.validators';

export interface AuthResult {
  token: string;
  utilisateur: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: 'ADMIN' | 'COACH' | 'CLIENT';
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await prisma.utilisateur.findUnique({ where: { email: input.email } });
    if (existing) {
      throw Conflict('Cet email est deja utilise');
    }

    const role = await prisma.role.findUnique({ where: { libelle: 'CLIENT' } });
    if (!role) {
      throw new Error('Role CLIENT introuvable. Avez-vous lance le seed ?');
    }

    const motDePasse = await hashPassword(input.motDePasse);
    const utilisateur = await prisma.utilisateur.create({
      data: {
        email: input.email,
        motDePasse,
        nom: input.nom,
        prenom: input.prenom,
        roleId: role.id,
      },
      include: { role: true },
    });

    const token = signToken({
      sub: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role.libelle,
    });

    return {
      token,
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role.libelle,
      },
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email: input.email },
      include: { role: true },
    });
    if (!utilisateur) {
      throw Unauthorized('Identifiants invalides');
    }

    const ok = await comparePassword(input.motDePasse, utilisateur.motDePasse);
    if (!ok) {
      throw Unauthorized('Identifiants invalides');
    }

    const token = signToken({
      sub: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role.libelle,
    });

    return {
      token,
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role.libelle,
      },
    };
  },
};
