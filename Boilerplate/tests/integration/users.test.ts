import request from 'supertest';
import { createApp } from '../../src/app';
import {
  cleanDatabase,
  createUser,
  createAdmin,
  generateTestAccessToken,
  generateExpiredAccessToken,
  generateInvalidToken,
} from '../helpers';

const app = createApp();

describe('Users Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /users', () => {
    it('should return paginated users list for admin', async () => {
      const admin = await createAdmin();
      await createUser({ email: 'user1@example.com' });
      await createUser({ email: 'user2@example.com' });

      const token = generateTestAccessToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should support pagination', async () => {
      const admin = await createAdmin();
      for (let i = 0; i < 15; i++) {
        await createUser({ email: `user${i}@example.com` });
      }

      const token = generateTestAccessToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const response = await request(app)
        .get('/users?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(5);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should filter by role', async () => {
      const admin = await createAdmin();
      await createUser({ email: 'user1@example.com' });
      await createAdmin({ email: 'admin2@example.com' });

      const token = generateTestAccessToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const response = await request(app)
        .get('/users?role=ADMIN')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users.every((u: { role: string }) => u.role === 'ADMIN')).toBe(
        true
      );
    });

    it('should return 403 for non-admin users', async () => {
      const user = await createUser();

      const token = generateTestAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /users/:id', () => {
    it('should return user profile for own profile', async () => {
      const user = await createUser();

      const token = generateTestAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response = await request(app)
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should allow admin to view any profile', async () => {
      const admin = await createAdmin();
      const user = await createUser();

      const token = generateTestAccessToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const response = await request(app)
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.id).toBe(user.id);
    });

    it('should return 403 when viewing other user profile', async () => {
      const user1 = await createUser({ email: 'user1@example.com' });
      const user2 = await createUser({ email: 'user2@example.com' });

      const token = generateTestAccessToken({
        userId: user1.id,
        email: user1.email,
        role: user1.role,
      });

      const response = await request(app)
        .get(`/users/${user2.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const admin = await createAdmin();

      const token = generateTestAccessToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const response = await request(app)
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const user = await createUser();

      const token = generateTestAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response = await request(app)
        .get('/users/invalid-uuid')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update own email', async () => {
      const user = await createUser();

      const token = generateTestAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response = await request(app)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'newemail@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('newemail@example.com');
    });

    it('should allow admin to update user role', async () => {
      const admin = await createAdmin();
      const user = await createUser();

      const token = generateTestAccessToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const response = await request(app)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'MODERATOR' });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('MODERATOR');
    });

    it('should return 403 when non-admin tries to change role', async () => {
      const user = await createUser();

      const token = generateTestAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response = await request(app)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);
    });

    it('should return 403 when updating other user profile', async () => {
      const user1 = await createUser({ email: 'user1@example.com' });
      const user2 = await createUser({ email: 'user2@example.com' });

      const token = generateTestAccessToken({
        userId: user1.id,
        email: user1.email,
        role: user1.role,
      });

      const response = await request(app)
        .patch(`/users/${user2.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'hacked@example.com' });

      expect(response.status).toBe(403);
    });

    it('should return 409 when email already exists', async () => {
      const user1 = await createUser({ email: 'user1@example.com' });
      await createUser({ email: 'existing@example.com' });

      const token = generateTestAccessToken({
        userId: user1.id,
        email: user1.email,
        role: user1.role,
      });

      const response = await request(app)
        .patch(`/users/${user1.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'existing@example.com' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should allow admin to delete user', async () => {
      const admin = await createAdmin();
      const user = await createUser();

      const token = generateTestAccessToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const response = await request(app)
        .delete(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.message).toBe('User deleted successfully');
    });

    it('should return 403 for non-admin users', async () => {
      const user1 = await createUser({ email: 'user1@example.com' });
      const user2 = await createUser({ email: 'user2@example.com' });

      const token = generateTestAccessToken({
        userId: user1.id,
        email: user1.email,
        role: user1.role,
      });

      const response = await request(app)
        .delete(`/users/${user2.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const admin = await createAdmin();

      const token = generateTestAccessToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const response = await request(app)
        .delete('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Authentication', () => {
    it('should return 401 for expired token', async () => {
      const user = await createUser();

      const token = generateExpiredAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response = await request(app)
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 401 for invalid token', async () => {
      const user = await createUser();

      const response = await request(app)
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${generateInvalidToken()}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 for missing Authorization header', async () => {
      const user = await createUser();

      const response = await request(app).get(`/users/${user.id}`);

      expect(response.status).toBe(401);
    });

    it('should return 401 for malformed Authorization header', async () => {
      const user = await createUser();

      const response = await request(app)
        .get(`/users/${user.id}`)
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
    });
  });
});
