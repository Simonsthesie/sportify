import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  motDePasse: z
    .string()
    .min(8, 'Mot de passe trop court (8 min)')
    .max(128, 'Mot de passe trop long'),
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(1, 'Mot de passe requis'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
