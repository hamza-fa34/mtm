import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, Prisma, ServiceMode } from '@prisma/client';

type CreateOrderItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantName?: string;
  isRedeemed?: boolean;
  redeemedPoints?: number;
};

type CreateOrderInput = {
  items: CreateOrderItemInput[];
  total: number;
  paymentMethod: PaymentMethod;
  serviceMode: ServiceMode;
  idempotencyKey?: string;
  customerId?: string;
  sessionId?: string;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const orders = await this.prisma.order.findMany({
      orderBy: [{ orderedAt: 'desc' }],
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: {
                  orderBy: [{ name: 'asc' }],
                },
                recipeItems: true,
              },
            },
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      timestamp: order.orderedAt.getTime(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: {
          id: item.product.id,
          categoryId: item.product.categoryId,
          name: item.product.name,
          price: Number(item.product.price),
          vatRate: Number(item.product.vatRate),
          recipe: item.product.recipeItems.map((recipeItem) => ({
            ingredientId: recipeItem.ingredientId,
            quantity: Number(recipeItem.quantity),
          })),
          imageUrl: item.product.imageUrl ?? undefined,
          isAvailable: item.product.isAvailable,
          loyaltyPrice: item.product.loyaltyPoints ?? undefined,
          variants: item.product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            priceExtra: Number(variant.priceExtra),
          })),
        },
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        isRedeemed: item.isRedeemed || undefined,
        selectedVariant: item.variantName
          ? {
              id: `legacy-${item.variantName}`,
              name: item.variantName,
              priceExtra: 0,
            }
          : undefined,
      })),
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.paymentMethod ?? undefined,
      serviceMode: order.serviceMode,
      customerId: order.customerId ?? undefined,
    }));
  }

  async createOrder(input: CreateOrderInput) {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Invalid payload');
    }
    const normalizedIdempotencyKey =
      typeof input.idempotencyKey === 'string' &&
      input.idempotencyKey.trim().length > 0
        ? input.idempotencyKey.trim()
        : undefined;

    if (normalizedIdempotencyKey) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey: normalizedIdempotencyKey },
        include: { items: true },
      });
      if (existingOrder) {
        return this.serializeOrder(existingOrder);
      }
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException('Order items are required');
    }
    if (!Number.isFinite(input.total) || input.total < 0) {
      throw new BadRequestException('Order total is invalid');
    }

    const normalizedItems = input.items.map((item) => {
      if (!item.productId) {
        throw new BadRequestException('productId is required for each item');
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException('quantity must be > 0');
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        throw new BadRequestException('unitPrice must be >= 0');
      }
      if (!Number.isFinite(item.totalPrice) || item.totalPrice < 0) {
        throw new BadRequestException('totalPrice must be >= 0');
      }
      return {
        ...item,
        quantity: Math.floor(item.quantity),
      };
    });

    const computedTotal = Number(
      normalizedItems
        .reduce((acc, item) => acc + Number(item.totalPrice), 0)
        .toFixed(2),
    );
    const providedTotal = Number(input.total.toFixed(2));
    if (Math.abs(computedTotal - providedTotal) > 0.01) {
      throw new BadRequestException('Order total does not match item totals');
    }

    let order:
      | Prisma.OrderGetPayload<{
          include: { items: true };
        }>
      | null = null;

    try {
      order = await this.prisma.$transaction(async (tx) => {
      const session = await this.resolveOpenSession(tx, input.sessionId);

      const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { recipeItems: true },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products were not found');
      }

      const productById = new Map(products.map((product) => [product.id, product]));
      for (const item of normalizedItems) {
        const product = productById.get(item.productId);
        if (!product || !product.isAvailable) {
          throw new ConflictException(`Product unavailable: ${item.productId}`);
        }
      }

      const requiredByIngredient = new Map<string, number>();
      for (const item of normalizedItems) {
        const product = productById.get(item.productId)!;
        for (const recipeItem of product.recipeItems) {
          const current = requiredByIngredient.get(recipeItem.ingredientId) ?? 0;
          requiredByIngredient.set(
            recipeItem.ingredientId,
            current + Number(recipeItem.quantity) * item.quantity,
          );
        }
      }

      const ingredientIds = [...requiredByIngredient.keys()];
      if (ingredientIds.length > 0) {
        const ingredients = await tx.ingredient.findMany({
          where: { id: { in: ingredientIds } },
        });
        if (ingredients.length !== ingredientIds.length) {
          throw new ConflictException('Inventory data is incomplete');
        }

        for (const ingredient of ingredients) {
          const required = requiredByIngredient.get(ingredient.id) ?? 0;
          const currentStock = Number(ingredient.currentStock);
          if (currentStock < required) {
            throw new ConflictException(
              `Insufficient stock for ingredient ${ingredient.name}`,
            );
          }
        }

        for (const [ingredientId, required] of requiredByIngredient.entries()) {
          await tx.ingredient.update({
            where: { id: ingredientId },
            data: { currentStock: { decrement: required } },
          });
        }
      }

      const orderNumber = await this.generateOrderNumber(tx);
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          idempotencyKey: normalizedIdempotencyKey,
          total: providedTotal,
          status: 'PENDING',
          paymentMethod: input.paymentMethod,
          serviceMode: input.serviceMode,
          customerId: input.customerId,
          sessionId: session.id,
          items: {
            createMany: {
              data: normalizedItems.map((item) => ({
                productId: item.productId,
                variantName: item.variantName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                isRedeemed: item.isRedeemed ?? false,
                redeemedPoints: item.redeemedPoints,
              })),
            },
          },
        },
        include: {
          items: true,
        },
      });

      await tx.dailySession.update({
        where: { id: session.id },
        data: {
          totalSales: { increment: providedTotal },
          ordersCount: { increment: 1 },
        },
      });

      if (input.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: input.customerId },
        });
        if (customer) {
          const pointsEarned = Math.floor(providedTotal);
          const pointsSpent = normalizedItems.reduce((acc, item) => {
            if (item.isRedeemed) return acc + (item.redeemedPoints ?? 100);
            return acc;
          }, 0);
          const nextPoints = Math.max(
            0,
            customer.loyaltyPoints + pointsEarned - pointsSpent,
          );
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              loyaltyPoints: nextPoints,
              lastVisitAt: new Date(),
            },
          });
        }
      }

      return createdOrder;
    });
    } catch (error) {
      if (
        normalizedIdempotencyKey &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingOrder = await this.prisma.order.findUnique({
          where: { idempotencyKey: normalizedIdempotencyKey },
          include: { items: true },
        });
        if (existingOrder) {
          return this.serializeOrder(existingOrder);
        }
      }
      throw error;
    }

    return this.serializeOrder(order);
  }

  private serializeOrder(
    order: Prisma.OrderGetPayload<{
      include: { items: true };
    }>,
  ) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      timestamp: order.orderedAt.getTime(),
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.paymentMethod ?? undefined,
      serviceMode: order.serviceMode,
      customerId: order.customerId ?? undefined,
      sessionId: order.sessionId ?? undefined,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        variantName: item.variantName ?? undefined,
        isRedeemed: item.isRedeemed || undefined,
        redeemedPoints: item.redeemedPoints ?? undefined,
      })),
    };
  }

  private async resolveOpenSession(
    tx: Prisma.TransactionClient,
    sessionId?: string,
  ) {
    if (sessionId) {
      const session = await tx.dailySession.findUnique({ where: { id: sessionId } });
      if (!session || session.status !== 'OPEN') {
        throw new ConflictException('Session is not open');
      }
      return session;
    }

    const openSession = await tx.dailySession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { startTime: 'desc' },
    });
    if (!openSession) {
      throw new ConflictException('No open session');
    }
    return openSession;
  }

  private async generateOrderNumber(tx: Prisma.TransactionClient) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayCount = await tx.order.count({
      where: {
        orderedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}${String(today.getDate()).padStart(2, '0')}`;
    const seqPart = String(todayCount + 1).padStart(4, '0');
    return `ORD-${datePart}-${seqPart}`;
  }
}
