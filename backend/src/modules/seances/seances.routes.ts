import { Router } from 'express';
import { seancesController } from './seances.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createSeanceSchema, updateSeanceSchema } from './seances.validators';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /seances:
 *   get:
 *     summary: Liste de toutes les seances
 *     tags: [Seances]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Liste des seances }
 */
router.get('/', seancesController.list);

/**
 * @openapi
 * /seances/me:
 *   get:
 *     summary: Planning du coach connecte
 *     tags: [Seances]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', authorize('COACH'), seancesController.listMine);

/**
 * @openapi
 * /seances/{id}:
 *   get:
 *     summary: Detail d'une seance
 *     tags: [Seances]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
router.get('/:id', seancesController.getById);

/**
 * @openapi
 * /seances:
 *   post:
 *     summary: Creer une seance (coach ou admin)
 *     tags: [Seances]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titre, dateDebut, dateFin, capaciteMax]
 *             properties:
 *               titre: { type: string }
 *               description: { type: string }
 *               dateDebut: { type: string, format: date-time }
 *               dateFin: { type: string, format: date-time }
 *               capaciteMax: { type: integer }
 *               lieu: { type: string }
 *               coachId: { type: integer, description: "Requis si admin" }
 */
router.post('/', authorize('COACH', 'ADMIN'), validate(createSeanceSchema), seancesController.create);

/**
 * @openapi
 * /seances/{id}:
 *   patch:
 *     summary: Modifier une seance (son coach ou admin)
 *     tags: [Seances]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id', authorize('COACH', 'ADMIN'), validate(updateSeanceSchema), seancesController.update);

/**
 * @openapi
 * /seances/{id}:
 *   delete:
 *     summary: Supprimer une seance (son coach ou admin)
 *     tags: [Seances]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', authorize('COACH', 'ADMIN'), seancesController.remove);

/**
 * @openapi
 * /seances/{id}/participants:
 *   get:
 *     summary: Liste des participants d'une seance
 *     tags: [Seances]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id/participants', authorize('COACH', 'ADMIN'), seancesController.participants);

export default router;
