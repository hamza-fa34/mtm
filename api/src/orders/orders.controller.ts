import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PaymentMethod, ServiceMode } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('MANAGER', 'STAFF')
  async findAll() {
    return this.ordersService.findAll();
  }

  @Post()
  @Roles('MANAGER', 'STAFF')
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
