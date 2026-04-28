import { z } from 'zod';

export const createSeanceSchema = z
  .object({
    titre: z.string().min(2).max(150),
    description: z.string().max(2000).optional(),
    dateDebut: z.coerce.date(),
    dateFin: z.coerce.date(),
    capaciteMax: z.coerce.number().int().positive().max(500),
    lieu: z.string().max(150).optional(),
    coachId: z.coerce.number().int().positive().optional(),
  })
  .refine((d) => d.dateFin > d.dateDebut, {
    message: 'date_fin doit etre posterieure a date_debut',
    path: ['dateFin'],
  });

export const updateSeanceSchema = z
  .object({
    titre: z.string().min(2).max(150).optional(),
    description: z.string().max(2000).optional(),
    dateDebut: z.coerce.date().optional(),
    dateFin: z.coerce.date().optional(),
    capaciteMax: z.coerce.number().int().positive().max(500).optional(),
    lieu: z.string().max(150).optional(),
  })
  .refine(
    (d) => !(d.dateDebut && d.dateFin) || d.dateFin > d.dateDebut,
    { message: 'date_fin doit etre posterieure a date_debut', path: ['dateFin'] },
  );

export type CreateSeanceInput = z.infer<typeof createSeanceSchema>;
export type UpdateSeanceInput = z.infer<typeof updateSeanceSchema>;

export const listSeancesQuerySchema = z.object({
  q: z.string().optional(),
  coachId: z.coerce.number().int().positive().optional(),
  lieu: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListSeancesQuery = z.infer<typeof listSeancesQuerySchema>;
