import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  @Roles('MANAGER', 'STAFF')
  async findIngredients() {
    return this.inventoryService.findIngredients();
  }

  @Get('purchases')
  @Roles('MANAGER', 'STAFF')
  async findPurchases() {
    return this.inventoryService.findPurchases();
  }

  @Get('wastes')
  @Roles('MANAGER', 'STAFF')
  async findWastes() {
    return this.inventoryService.findWastes();
  }

  @Post('purchases')
  @Roles('MANAGER')
  async createPurchase(
    @Body()
    body: {
      ingredientId: string;
      supplierName?: string;
      quantity: number;
      totalPrice: number;
      date?: number;
    },
  ) {
    return this.inventoryService.createPurchase(body);
  }

  @Post('wastes')
  @Roles('MANAGER')
  async createWaste(
    @Body()
    body: {
      ingredientId: string;
      quantity: number;
      reason: string;
      date?: number;
    },
  ) {
    return this.inventoryService.createWaste(body);
  }
}
