import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, createUser, createRefreshToken } from '../helpers';
import { generateTestRefreshToken } from '../helpers/authHelper';
import { v4 as uuidv4 } from 'uuid';

const app = createApp();

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'newuser@example.com',
        password: 'ValidPass123!',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 409 if user already exists', async () => {
      await createUser({ email: 'existing@example.com' });

      const response = await request(app).post('/auth/register').send({
        email: 'existing@example.com',
        password: 'ValidPass123!',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'invalid-email',
        password: 'ValidPass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'weak',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app).post('/auth/register').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const user = await createUser({
        email: 'login@example.com',
        password: 'ValidPass123!',
      });

      const response = await request(app).post('/auth/login').send({
        email: user.email,
        password: 'ValidPass123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      const user = await createUser({ email: 'test@example.com' });

      const response = await request(app).post('/auth/login').send({
        email: user.email,
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'ValidPass123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app).post('/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await createUser();
      const tokenId = uuidv4();
      const refreshToken = generateTestRefreshToken(user.id, tokenId);

      await createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      // Token rotation: new refresh token should be set in cookie
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should invalidate old refresh token after use (token rotation)', async () => {
      const user = await createUser();
      const tokenId = uuidv4();
      const refreshToken = generateTestRefreshToken(user.id, tokenId);

      await createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // First refresh should succeed
      const firstResponse = await request(app)
        .post('/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(firstResponse.status).toBe(200);

      // Second refresh with same token should fail (token was rotated)
      const secondResponse = await request(app)
        .post('/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(secondResponse.status).toBe(401);
      expect(secondResponse.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 without refresh token', async () => {
      const response = await request(app).post('/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and clear refresh token cookie', async () => {
      const user = await createUser();
      const tokenId = uuidv4();
      const refreshToken = generateTestRefreshToken(user.id, tokenId);

      await createRefreshToken({
        userId: user.id,
        token: refreshToken,
      });

      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should succeed even without refresh token', async () => {
      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
