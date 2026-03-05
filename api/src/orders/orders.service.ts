import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
