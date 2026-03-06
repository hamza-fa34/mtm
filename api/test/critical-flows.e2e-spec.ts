import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Critical flows (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const managerPin = '1234';
  const staffPin = '0000';
  const managerId = 'usr_manager_e2e';
  const staffId = 'usr_staff_e2e';
  const categoryId = 'cat_e2e';
  const ingredientId = 'ing_e2e';
  const productId = 'prd_e2e';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    const connectionString =
      process.env.DATABASE_URL || 'postgresql://mtm:mtm@localhost:5432/mtm';
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.dailySession.updateMany({
      where: { status: 'OPEN' },
      data: { status: 'CLOSED', endTime: new Date(), finalCash: 0 },
    });

    await prisma.user.upsert({
      where: { id: managerId },
      update: { name: 'Manager E2E', role: 'MANAGER', pinHash: managerPin, isActive: true },
      create: { id: managerId, name: 'Manager E2E', role: 'MANAGER', pinHash: managerPin, isActive: true },
    });

    await prisma.user.upsert({
      where: { id: staffId },
      update: { name: 'Staff E2E', role: 'STAFF', pinHash: staffPin, isActive: true },
      create: { id: staffId, name: 'Staff E2E', role: 'STAFF', pinHash: staffPin, isActive: true },
    });

    await prisma.category.upsert({
      where: { id: categoryId },
      update: { name: 'E2E Category', color: 'bg-gray-500', order: 1 },
      create: { id: categoryId, name: 'E2E Category', color: 'bg-gray-500', order: 1 },
    });

    await prisma.ingredient.upsert({
      where: { id: ingredientId },
      update: {
        name: 'E2E Ingredient',
        unit: 'UNIT',
        currentStock: 20,
        minStock: 1,
        costPrice: 1,
        category: 'TEST',
      },
      create: {
        id: ingredientId,
        name: 'E2E Ingredient',
        unit: 'UNIT',
        currentStock: 20,
        minStock: 1,
        costPrice: 1,
        category: 'TEST',
      },
    });

    await prisma.product.upsert({
      where: { id: productId },
      update: {
        categoryId,
        name: 'E2E Product',
        price: 10,
        vatRate: 10,
        isAvailable: true,
      },
      create: {
        id: productId,
        categoryId,
        name: 'E2E Product',
        price: 10,
        vatRate: 10,
        isAvailable: true,
      },
    });

    await prisma.recipeItem.deleteMany({ where: { productId } });
    await prisma.recipeItem.create({
      data: {
        productId,
        ingredientId,
        quantity: 2,
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('enforces auth and role boundaries on sessions open', async () => {
    await request(app.getHttpServer()).get('/api/sessions/current').expect(401);

    const staffLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ pin: staffPin })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/sessions/open')
      .set('Authorization', `Bearer ${staffLogin.body.accessToken}`)
      .send({ initialCash: 100 })
      .expect(403);
  });

  it('creates order transactionally and decrements stock', async () => {
    const managerLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ pin: managerPin })
      .expect(201);
    const token = managerLogin.body.accessToken;

    const open = await request(app.getHttpServer())
      .post('/api/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ initialCash: 100 })
      .expect(201);

    const before = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
    expect(before).toBeTruthy();

    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId: open.body.id,
        paymentMethod: 'CASH',
        serviceMode: 'TAKEAWAY',
        total: 10,
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 10,
            totalPrice: 10,
          },
        ],
      })
      .expect(201);

    const after = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
    expect(Number(after?.currentStock)).toBe(Number(before?.currentStock) - 2);

    await request(app.getHttpServer())
      .post('/api/sessions/close')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId: open.body.id, finalCash: 110 })
      .expect(201);
  });
});

