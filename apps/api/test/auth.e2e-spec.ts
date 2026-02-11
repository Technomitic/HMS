import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableVersioning({ type: 1, prefix: 'api/v', defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `test_${Date.now()}@example.com`,
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.user).toBeDefined();
          expect(res.body.data.accessToken).toBeDefined();
          expect(res.body.data.refreshToken).toBeDefined();
          expect(res.body.data.user.role).toBe('PATIENT');
        });
    });

    it('should reject duplicate email', async () => {
      const email = `dup_${Date.now()}@example.com`;

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'TestPass123!',
          firstName: 'Dup',
          lastName: 'User',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'TestPass123!',
          firstName: 'Dup',
          lastName: 'User',
        })
        .expect(409);
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `weak_${Date.now()}@example.com`,
          password: 'weak',
          firstName: 'Weak',
          lastName: 'Pass',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const testEmail = `login_test_${Date.now()}@example.com`;

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: 'TestPass123!',
          firstName: 'Login',
          lastName: 'Test',
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'TestPass123!' })
        .expect(200)
        .expect((res) => {
          accessToken = res.body.data.accessToken;
          refreshToken = res.body.data.refreshToken;
          expect(accessToken).toBeDefined();
          expect(refreshToken).toBeDefined();
          expect(res.body.data.user.email).toBe(testEmail);
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'WrongPass123!' })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.email).toBeDefined();
          expect(res.body.data.firstName).toBeDefined();
        });
    });

    it('should reject without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should issue new tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });
  });
});