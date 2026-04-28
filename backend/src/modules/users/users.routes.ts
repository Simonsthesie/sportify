import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { updateRoleSchema } from './users.validators';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Liste tous les utilisateurs (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Liste des utilisateurs }
 *       403: { description: Acces interdit }
 */
router.get('/', authorize('ADMIN'), usersController.list);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Detail d'un utilisateur (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Detail }
 *       404: { description: Introuvable }
 */
router.get('/:id', authorize('ADMIN'), usersController.getById);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     summary: Modifie le role d'un utilisateur (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [ADMIN, COACH, CLIENT] }
 *     responses:
 *       200: { description: Role modifie }
 */
router.patch('/:id/role', authorize('ADMIN'), validate(updateRoleSchema), usersController.updateRole);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Supprime un utilisateur (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Supprime }
 */
router.delete('/:id', authorize('ADMIN'), usersController.remove);

export default router;
