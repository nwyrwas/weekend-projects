import { validationResult } from 'express-validator';
import { registerValidation, loginValidation } from '../../src/modules/auth/validators';
import {
  getUsersValidation,
  getUserByIdValidation,
  updateUserValidation,
} from '../../src/modules/users/validators';

const runValidation = async (
  validations: any[],
  body: Record<string, unknown>,
  params: Record<string, unknown> = {},
  query: Record<string, unknown> = {}
) => {
  const req = {
    body,
    params,
    query,
  };

  for (const validation of validations) {
    await validation.run(req);
  }

  return validationResult(req);
};

describe('Auth Validators', () => {
  describe('registerValidation', () => {
    it('should pass with valid email and password', async () => {
      const result = await runValidation(registerValidation, {
        email: 'test@example.com',
        password: 'ValidPass123!',
      });

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with missing email', async () => {
      const result = await runValidation(registerValidation, {
        password: 'ValidPass123!',
      });

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.type === 'field' && e.path === 'email')).toBe(true);
    });

    it('should fail with invalid email format', async () => {
      const result = await runValidation(registerValidation, {
        email: 'invalid-email',
        password: 'ValidPass123!',
      });

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with missing password', async () => {
      const result = await runValidation(registerValidation, {
        email: 'test@example.com',
      });

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => e.type === 'field' && e.path === 'password')).toBe(true);
    });

    it('should fail with password less than 8 characters', async () => {
      const result = await runValidation(registerValidation, {
        email: 'test@example.com',
        password: 'Short1!',
      });

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with password without lowercase', async () => {
      const result = await runValidation(registerValidation, {
        email: 'test@example.com',
        password: 'UPPERCASE123!',
      });

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with password without uppercase', async () => {
      const result = await runValidation(registerValidation, {
        email: 'test@example.com',
        password: 'lowercase123!',
      });

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with password without number', async () => {
      const result = await runValidation(registerValidation, {
        email: 'test@example.com',
        password: 'NoNumbers!@#',
      });

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with password without special character', async () => {
      const result = await runValidation(registerValidation, {
        email: 'test@example.com',
        password: 'NoSpecial123',
      });

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('loginValidation', () => {
    it('should pass with valid email and password', async () => {
      const result = await runValidation(loginValidation, {
        email: 'test@example.com',
        password: 'anypassword',
      });

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with missing email', async () => {
      const result = await runValidation(loginValidation, {
        password: 'anypassword',
      });

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with missing password', async () => {
      const result = await runValidation(loginValidation, {
        email: 'test@example.com',
      });

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const result = await runValidation(loginValidation, {
        email: 'not-an-email',
        password: 'anypassword',
      });

      expect(result.isEmpty()).toBe(false);
    });
  });
});

describe('Users Validators', () => {
  describe('getUsersValidation', () => {
    it('should pass with no query params', async () => {
      const result = await runValidation(getUsersValidation, {}, {}, {});

      expect(result.isEmpty()).toBe(true);
    });

    it('should pass with valid page and limit', async () => {
      const result = await runValidation(getUsersValidation, {}, {}, { page: '1', limit: '10' });

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid page', async () => {
      const result = await runValidation(getUsersValidation, {}, {}, { page: '0' });

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with limit exceeding max', async () => {
      const result = await runValidation(getUsersValidation, {}, {}, { limit: '200' });

      expect(result.isEmpty()).toBe(false);
    });

    it('should pass with valid role', async () => {
      const result = await runValidation(getUsersValidation, {}, {}, { role: 'ADMIN' });

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid role', async () => {
      const result = await runValidation(getUsersValidation, {}, {}, { role: 'INVALID' });

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('getUserByIdValidation', () => {
    it('should pass with valid UUID', async () => {
      const result = await runValidation(
        getUserByIdValidation,
        {},
        { id: '123e4567-e89b-12d3-a456-426614174000' }
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid UUID', async () => {
      const result = await runValidation(getUserByIdValidation, {}, { id: 'not-a-uuid' });

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('updateUserValidation', () => {
    it('should pass with valid UUID and email', async () => {
      const result = await runValidation(
        updateUserValidation,
        { email: 'new@example.com' },
        { id: '123e4567-e89b-12d3-a456-426614174000' }
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should pass with valid role', async () => {
      const result = await runValidation(
        updateUserValidation,
        { role: 'ADMIN' },
        { id: '123e4567-e89b-12d3-a456-426614174000' }
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const result = await runValidation(
        updateUserValidation,
        { email: 'invalid-email' },
        { id: '123e4567-e89b-12d3-a456-426614174000' }
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid role', async () => {
      const result = await runValidation(
        updateUserValidation,
        { role: 'SUPERADMIN' },
        { id: '123e4567-e89b-12d3-a456-426614174000' }
      );

      expect(result.isEmpty()).toBe(false);
    });
  });
});
