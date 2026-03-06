import { Body, Controller, Get, Post } from '@nestjs/common';
import { PaymentMethod, ServiceMode } from '@prisma/client';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  @Post()
  async createOrder(
    @Body()
    body: {
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        variantName?: string;
        isRedeemed?: boolean;
        redeemedPoints?: number;
      }>;
      total: number;
      paymentMethod: PaymentMethod;
      serviceMode: ServiceMode;
      idempotencyKey?: string;
      customerId?: string;
      sessionId?: string;
    },
  ) {
    return this.ordersService.createOrder(body);
  }
}
