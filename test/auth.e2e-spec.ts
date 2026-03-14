import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { loginUser, registerUser } from './helpers/auth';
import { createTestApp, resetDatabase } from './helpers/test-app';

describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('registers a user', async () => {
    const response = await registerUser(app, 'auth-register@example.com');

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(String),
          email: 'auth-register@example.com',
        }),
      }),
    );
  });

  it('logs in and returns the current user via /me', async () => {
    await registerUser(app, 'auth-login@example.com');

    const loginResponse = await loginUser(app, 'auth-login@example.com');
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toEqual({
      accessToken: expect.any(String),
    });

    const meResponse = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        email: 'auth-login@example.com',
        createdAt: expect.any(String),
      }),
    );
  });
});
