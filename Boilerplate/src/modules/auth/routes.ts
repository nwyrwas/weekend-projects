import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import * as authController from './controller.js';
import { registerValidation, loginValidation } from './validators.js';

const router = Router();

router.use(authRateLimiter);

router.post('/register', validate(registerValidation), authController.register);

router.post('/login', validate(loginValidation), authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

export { router as authRoutes };
