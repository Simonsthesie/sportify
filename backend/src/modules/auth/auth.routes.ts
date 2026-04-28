import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { loginSchema, registerSchema } from './auth.validators';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouveau client
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, motDePasse, nom, prenom]
 *             properties:
 *               email: { type: string, format: email }
 *               motDePasse: { type: string, minLength: 8 }
 *               nom: { type: string }
 *               prenom: { type: string }
 *     responses:
 *       201: { description: Compte cree, retourne le token JWT }
 *       409: { description: Email deja utilise }
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Connexion
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, motDePasse]
 *             properties:
 *               email: { type: string }
 *               motDePasse: { type: string }
 *     responses:
 *       200: { description: Authentification reussie, retourne le token JWT }
 *       401: { description: Identifiants invalides }
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retourne le payload du JWT courant
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 *       401: { description: Non authentifie }
 */
router.get('/me', authenticate, authController.me);

export default router;
