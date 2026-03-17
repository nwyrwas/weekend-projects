import type { Request, Response, NextFunction } from 'express';
import { validationResult, type ValidationChain, type ValidationError } from 'express-validator';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../config/constants.js';

interface FormattedValidationError {
  field: string;
  message: string;
  value?: unknown;
}

function formatValidationErrors(errors: ValidationError[]): FormattedValidationError[] {
  return errors.map((error) => {
    if (error.type === 'field') {
      return {
        field: error.path,
        message: error.msg as string,
        value: error.value,
      };
    }
    return {
      field: 'unknown',
      message: error.msg as string,
    };
  });
}

export function validate(validations: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      next();
      return;
    }

    const formattedErrors = formatValidationErrors(errors.array());

    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, {
      errors: formattedErrors,
    });
  };
}
