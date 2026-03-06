import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findIngredients() {
    const ingredients = await this.prisma.ingredient.findMany({
      orderBy: [{ name: 'asc' }],
    });

    return ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit.toLowerCase(),
      currentStock: Number(ingredient.currentStock),
      minStock: Number(ingredient.minStock),
      costPrice: Number(ingredient.costPrice),
      category: ingredient.category,
    }));
  }

  async findPurchases() {
    const purchases = await this.prisma.purchase.findMany({
      orderBy: [{ purchasedAt: 'desc' }],
    });

    return purchases.map((purchase) => ({
      id: purchase.id,
      ingredientId: purchase.ingredientId,
      supplierName: purchase.supplierName ?? '',
      date: purchase.purchasedAt.getTime(),
      quantity: Number(purchase.quantity),
      totalPrice: Number(purchase.totalPrice),
    }));
  }

  async findWastes() {
    const wastes = await this.prisma.waste.findMany({
      orderBy: [{ wastedAt: 'desc' }],
    });

    return wastes.map((waste) => ({
      id: waste.id,
      ingredientId: waste.ingredientId,
      quantity: Number(waste.quantity),
      reason: waste.reason,
      date: waste.wastedAt.getTime(),
    }));
  }

  async createPurchase(input: {
    ingredientId: string;
    supplierName?: string;
    quantity: number;
    totalPrice: number;
    date?: number;
  }) {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Invalid payload');
    }
    if (!input.ingredientId) {
      throw new BadRequestException('ingredientId is required');
    }
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      throw new BadRequestException('quantity must be > 0');
    }
    if (!Number.isFinite(input.totalPrice) || input.totalPrice < 0) {
      throw new BadRequestException('totalPrice must be >= 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: input.ingredientId },
      });
      if (!ingredient) {
        throw new ConflictException('Ingredient not found');
      }

      const currentStock = Number(ingredient.currentStock);
      const currentCostPrice = Number(ingredient.costPrice);
      const nextStock = currentStock + input.quantity;
      const weightedCost =
        nextStock > 0
          ? (currentStock * currentCostPrice + input.totalPrice) / nextStock
          : currentCostPrice;

      const purchase = await tx.purchase.create({
        data: {
          ingredientId: ingredient.id,
          supplierName: input.supplierName?.trim() || null,
          quantity: input.quantity,
          totalPrice: input.totalPrice,
          purchasedAt: input.date ? new Date(input.date) : new Date(),
        },
      });

      await tx.ingredient.update({
        where: { id: ingredient.id },
        data: {
          currentStock: nextStock,
          costPrice: Number(weightedCost.toFixed(3)),
        },
      });

      return {
        id: purchase.id,
        ingredientId: purchase.ingredientId,
        supplierName: purchase.supplierName ?? '',
        date: purchase.purchasedAt.getTime(),
        quantity: Number(purchase.quantity),
        totalPrice: Number(purchase.totalPrice),
      };
    });
  }

  async createWaste(input: {
    ingredientId: string;
    quantity: number;
    reason: string;
    date?: number;
  }) {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Invalid payload');
    }
    if (!input.ingredientId) {
      throw new BadRequestException('ingredientId is required');
    }
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      throw new BadRequestException('quantity must be > 0');
    }
    if (typeof input.reason !== 'string' || input.reason.trim().length === 0) {
      throw new BadRequestException('reason is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: input.ingredientId },
      });
      if (!ingredient) {
        throw new ConflictException('Ingredient not found');
      }

      const currentStock = Number(ingredient.currentStock);
      if (currentStock < input.quantity) {
        throw new ConflictException('Insufficient stock for waste declaration');
      }

      const waste = await tx.waste.create({
        data: {
          ingredientId: ingredient.id,
          quantity: input.quantity,
          reason: input.reason.trim(),
          wastedAt: input.date ? new Date(input.date) : new Date(),
        },
      });

      await tx.ingredient.update({
        where: { id: ingredient.id },
        data: {
          currentStock: currentStock - input.quantity,
        },
      });

      return {
        id: waste.id,
        ingredientId: waste.ingredientId,
        quantity: Number(waste.quantity),
        reason: waste.reason,
        date: waste.wastedAt.getTime(),
      };
    });
  }
}
