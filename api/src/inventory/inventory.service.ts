import { Injectable } from '@nestjs/common';
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
}
