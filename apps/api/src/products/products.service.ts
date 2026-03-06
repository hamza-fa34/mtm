import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      orderBy: [{ name: 'asc' }],
      include: {
        variants: {
          orderBy: [{ name: 'asc' }],
        },
        recipeItems: true,
      },
    });

    return products.map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      price: Number(product.price),
      vatRate: Number(product.vatRate),
      recipe: product.recipeItems.map((recipeItem) => ({
        ingredientId: recipeItem.ingredientId,
        quantity: Number(recipeItem.quantity),
      })),
      imageUrl: product.imageUrl ?? undefined,
      isAvailable: product.isAvailable,
      loyaltyPrice: product.loyaltyPoints ?? undefined,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        priceExtra: Number(variant.priceExtra),
      })),
    }));
  }
}
