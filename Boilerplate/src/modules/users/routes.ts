import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { USER_ROLES } from '../../config/constants.js';
import * as usersController from './controller.js';
import {
  getUsersValidation,
  getUserByIdValidation,
  updateUserValidation,
  deleteUserValidation,
} from './validators.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(USER_ROLES.ADMIN),
  validate(getUsersValidation),
  usersController.getUsers
);

router.get('/:id', validate(getUserByIdValidation), usersController.getUserById);

router.patch('/:id', validate(updateUserValidation), usersController.updateUser);

router.delete(
  '/:id',
  authorize(USER_ROLES.ADMIN),
  validate(deleteUserValidation),
  usersController.deleteUser
);

export { router as usersRoutes };
