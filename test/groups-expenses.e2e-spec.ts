import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { registerAndLogin, registerUser } from './helpers/auth';
import { createTestApp, resetDatabase } from './helpers/test-app';

describe('Groups and expenses flow (e2e)', () => {
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

  it('creates a group, adds a member, creates an expense, and returns balances and settle', async () => {
    const owner = await registerAndLogin(app, 'owner@example.com');
    const memberRegisterResponse = await registerUser(app, 'member@example.com');
    const memberId = memberRegisterResponse.body.user.id as string;

    const groupResponse = await request(app.getHttpServer())
      .post('/groups')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Trip fund' });

    expect(groupResponse.status).toBe(201);
    expect(groupResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Trip fund',
        ownerId: owner.user.id,
      }),
    );

    const groupId = groupResponse.body.id as string;

    const addMemberResponse = await request(app.getHttpServer())
      .post(`/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: 'member@example.com' });

    expect(addMemberResponse.status).toBe(201);
    expect(addMemberResponse.body).toEqual(
      expect.objectContaining({
        id: memberId,
        email: 'member@example.com',
        role: 'member',
      }),
    );

    const expenseResponse = await request(app.getHttpServer())
      .post(`/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        description: 'Dinner',
        amount: 3000,
        paidByUserId: owner.user.id,
        splits: [
          { userId: owner.user.id, amount: 1500 },
          { userId: memberId, amount: 1500 },
        ],
      });

    expect(expenseResponse.status).toBe(201);
    expect(expenseResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        groupId,
        description: 'Dinner',
        amount: 3000,
        paidByUserId: owner.user.id,
      }),
    );

    const balancesResponse = await request(app.getHttpServer())
      .get(`/groups/${groupId}/balances`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(balancesResponse.status).toBe(200);
    expect(balancesResponse.body).toEqual(
      expect.objectContaining({
        groupId,
        page: 1,
        pageSize: 20,
        total: expect.any(Number),
        balances: expect.arrayContaining([
          expect.objectContaining({
            userId: memberId,
            balance: -1500,
          }),
          expect.objectContaining({
            userId: owner.user.id,
            balance: 1500,
          }),
        ]),
      }),
    );

    const settleResponse = await request(app.getHttpServer())
      .get(`/groups/${groupId}/settle`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(settleResponse.status).toBe(200);
    expect(settleResponse.body).toEqual(
      expect.objectContaining({
        groupId,
        page: 1,
        pageSize: 20,
        total: expect.any(Number),
        transfers: expect.arrayContaining([
          expect.objectContaining({
            fromUserId: memberId,
            toUserId: owner.user.id,
            amount: 1500,
          }),
        ]),
      }),
    );
  });
});
