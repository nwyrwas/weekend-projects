import { hashPassword, comparePassword } from '../../src/utils/passwordUtils';

describe('Password Utils', () => {
  const testPassword = 'TestPassword123!';

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword(testPassword);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(testPassword);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate hash starting with bcrypt identifier', async () => {
      const hash = await hashPassword(testPassword);

      expect(hash.startsWith('$2')).toBe(true);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const hash = await hashPassword(testPassword);
      const isMatch = await comparePassword(testPassword, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const hash = await hashPassword(testPassword);
      const isMatch = await comparePassword('WrongPassword123!', hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword(testPassword);
      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(specialPassword);
      const isMatch = await comparePassword(specialPassword, hash);

      expect(isMatch).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = '密码Test123!';
      const hash = await hashPassword(unicodePassword);
      const isMatch = await comparePassword(unicodePassword, hash);

      expect(isMatch).toBe(true);
    });
  });
});
