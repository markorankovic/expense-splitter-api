import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export async function registerUser(
  app: INestApplication,
  email: string,
  password = 'password123',
) {
  const response = await request(app.getHttpServer()).post('/auth/register').send({
    email,
    password,
  });

  return response;
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password = 'password123',
) {
  const response = await request(app.getHttpServer()).post('/auth/login').send({
    email,
    password,
  });

  return response;
}

export async function registerAndLogin(
  app: INestApplication,
  email: string,
  password = 'password123',
) {
  const registerResponse = await registerUser(app, email, password);
  const loginResponse = await loginUser(app, email, password);

  return {
    registerResponse,
    loginResponse,
    token: loginResponse.body.accessToken as string,
    user: registerResponse.body.user as { id: string; email: string },
  };
}
