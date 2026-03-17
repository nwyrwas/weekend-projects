import { body, param, query } from 'express-validator';
import { USER_ROLES, PAGINATION } from '../../config/constants.js';

export const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION.MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`)
    .toInt(),

  query('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage(`Role must be one of: ${Object.values(USER_ROLES).join(', ')}`),
];

export const getUserByIdValidation = [
  param('id').isUUID().withMessage('Invalid user ID format'),
];

export const updateUserValidation = [
  param('id').isUUID().withMessage('Invalid user ID format'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage(`Role must be one of: ${Object.values(USER_ROLES).join(', ')}`),
];

export const deleteUserValidation = [
  param('id').isUUID().withMessage('Invalid user ID format'),
];
