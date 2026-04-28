import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'COACH', 'CLIENT']),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
