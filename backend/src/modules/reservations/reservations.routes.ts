import { Router } from 'express';
import { reservationsController } from './reservations.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createReservationSchema } from './reservations.validators';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /reservations/me:
 *   get:
 *     summary: Liste mes reservations
 *     tags: [Reservations]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', reservationsController.listMine);

/**
 * @openapi
 * /reservations:
 *   get:
 *     summary: Toutes les reservations (admin)
 *     tags: [Reservations]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', authorize('ADMIN'), reservationsController.listAll);

/**
 * @openapi
 * /reservations:
 *   post:
 *     summary: Reserver une seance
 *     tags: [Reservations]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seanceId]
 *             properties:
 *               seanceId: { type: integer }
 *     responses:
 *       201: { description: Reservation creee }
 *       409: { description: Conflit (deja reserve, complet, creneau occupe) }
 */
router.post('/', authorize('CLIENT'), validate(createReservationSchema), reservationsController.create);

/**
 * @openapi
 * /reservations/{id}/cancel:
 *   patch:
 *     summary: Annuler une reservation
 *     tags: [Reservations]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/cancel', reservationsController.cancel);

export default router;
