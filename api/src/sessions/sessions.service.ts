import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PaymentMethod, Prisma, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type OpenSessionInput = {
  initialCash: number;
  startTime?: number;
};

type CloseSessionInput = {
  sessionId?: string;
  finalCash: number;
  endTime?: number;
  expectedTotals?: {
    totalSales?: number;
    ordersCount?: number;
    totalExpenses?: number;
  };
};

type VatSummary = Record<string, { baseHT: number; amountTVA: number }>;
type SalesByMethod = Record<string, number>;

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const sessions = await this.prisma.dailySession.findMany({
      orderBy: [{ startTime: 'desc' }],
    });
    return sessions.map((session) => this.serializeSession(session));
  }

  async findCurrent() {
    const session = await this.prisma.dailySession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { startTime: 'desc' },
    });
    return session ? this.serializeSession(session) : null;
  }

  async open(input: OpenSessionInput) {
    if (!Number.isFinite(input.initialCash) || input.initialCash < 0) {
      throw new BadRequestException('initialCash must be >= 0');
    }

    const startTime = input.startTime ? new Date(input.startTime) : new Date();
    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException('startTime is invalid');
    }

    const session = await this.prisma.$transaction(async (tx) => {
      const existingOpen = await tx.dailySession.findFirst({
        where: { status: 'OPEN' },
      });
      if (existingOpen) {
        throw new ConflictException('An open session already exists');
      }

      return tx.dailySession.create({
        data: {
          startTime,
          initialCash: input.initialCash,
          totalSales: 0,
          totalExpenses: 0,
          ordersCount: 0,
          status: 'OPEN',
        },
      });
    });

    return this.serializeSession(session);
  }

  async close(input: CloseSessionInput) {
    if (!Number.isFinite(input.finalCash) || input.finalCash < 0) {
      throw new BadRequestException('finalCash must be >= 0');
    }

    const closeAt = input.endTime ? new Date(input.endTime) : new Date();
    if (Number.isNaN(closeAt.getTime())) {
      throw new BadRequestException('endTime is invalid');
    }

    return this.prisma.$transaction(async (tx) => {
      const session = input.sessionId
        ? await tx.dailySession.findUnique({ where: { id: input.sessionId } })
        : await tx.dailySession.findFirst({
            where: { status: 'OPEN' },
            orderBy: { startTime: 'desc' },
          });

      if (!session) {
        throw new ConflictException('No open session');
      }
      if (session.status !== 'OPEN') {
        throw new ConflictException('Session is already closed');
      }
      if (closeAt < session.startTime) {
        throw new BadRequestException('endTime must be >= startTime');
      }

      const orders = await tx.order.findMany({
        where: {
          sessionId: session.id,
          status: { not: 'CANCELLED' },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  vatRate: true,
                },
              },
            },
          },
        },
      });

      const totalSales = Number(
        orders.reduce((acc, order) => acc + Number(order.total), 0).toFixed(2),
      );
      const ordersCount = orders.length;

      const salesByMethod: SalesByMethod = {};
      for (const method of ['CASH', 'CARD', 'TR']) {
        salesByMethod[method] = 0;
      }
      for (const order of orders) {
        const method = order.paymentMethod ?? 'UNKNOWN';
        salesByMethod[method] = Number(
          ((salesByMethod[method] ?? 0) + Number(order.total)).toFixed(2),
        );
      }

      const vatSummary: VatSummary = {};
      for (const order of orders) {
        for (const item of order.items) {
          const lineTtc = Number(item.totalPrice);
          const rate = Number(item.product.vatRate);
          const divisor = 1 + rate / 100;
          const baseHT = Number((lineTtc / divisor).toFixed(2));
          const amountTVA = Number((lineTtc - baseHT).toFixed(2));
          const key = rate.toFixed(2);
          const current = vatSummary[key] ?? { baseHT: 0, amountTVA: 0 };
          vatSummary[key] = {
            baseHT: Number((current.baseHT + baseHT).toFixed(2)),
            amountTVA: Number((current.amountTVA + amountTVA).toFixed(2)),
          };
        }
      }

      const expenses = await tx.expense.findMany({
        where: {
          spentAt: {
            gte: session.startTime,
            lte: closeAt,
          },
        },
      });
      const totalExpenses = Number(
        expenses.reduce((acc, expense) => acc + Number(expense.amountTTC), 0).toFixed(2),
      );

      this.assertExpectedTotals(input.expectedTotals, {
        totalSales,
        ordersCount,
        totalExpenses,
      });

      const closed = await tx.dailySession.update({
        where: { id: session.id },
        data: {
          endTime: closeAt,
          finalCash: input.finalCash,
          totalSales,
          totalExpenses,
          ordersCount,
          status: 'CLOSED',
        },
      });

      const cashSales = Number((salesByMethod[PaymentMethod.CASH] ?? 0).toFixed(2));
      const cashExpenses = Number(
        expenses
          .filter((expense) => expense.paymentMethod.toLowerCase().includes('caisse'))
          .reduce((acc, expense) => acc + Number(expense.amountTTC), 0)
          .toFixed(2),
      );
      const expectedFinalCash = Number(
        (Number(closed.initialCash) + cashSales - cashExpenses).toFixed(2),
      );
      const cashDelta = Number((input.finalCash - expectedFinalCash).toFixed(2));

      return {
        ...this.serializeSession(closed),
        salesByMethod,
        vatSummary,
        reconciliation: {
          expectedFinalCash,
          declaredFinalCash: Number(closed.finalCash ?? 0),
          cashSales,
          cashExpenses,
          cashDelta,
        },
      };
    });
  }

  private assertExpectedTotals(
    expected: CloseSessionInput['expectedTotals'],
    actual: { totalSales: number; ordersCount: number; totalExpenses: number },
  ) {
    if (!expected) return;

    const checks: Array<[keyof typeof actual, number | undefined, number, number]> = [
      ['totalSales', expected.totalSales, actual.totalSales, 0.01],
      ['ordersCount', expected.ordersCount, actual.ordersCount, 0],
      ['totalExpenses', expected.totalExpenses, actual.totalExpenses, 0.01],
    ];

    for (const [field, expectedValue, actualValue, tolerance] of checks) {
      if (typeof expectedValue !== 'number') continue;
      const delta = Math.abs(actualValue - expectedValue);
      if (delta > tolerance) {
        throw new ConflictException(
          `Session reconciliation mismatch on ${field}: expected ${expectedValue}, got ${actualValue}`,
        );
      }
    }
  }

  private serializeSession(
    session: Prisma.DailySessionGetPayload<{
      select: {
        id: true;
        startTime: true;
        endTime: true;
        initialCash: true;
        finalCash: true;
        totalSales: true;
        totalExpenses: true;
        ordersCount: true;
        status: true;
      };
    }> & { status: SessionStatus },
  ) {
    return {
      id: session.id,
      startTime: session.startTime.getTime(),
      endTime: session.endTime ? session.endTime.getTime() : undefined,
      initialCash: Number(session.initialCash),
      finalCash: session.finalCash === null ? undefined : Number(session.finalCash),
      totalSales: Number(session.totalSales),
      totalExpenses: Number(session.totalExpenses),
      ordersCount: session.ordersCount,
      status: session.status,
    };
  }
}

