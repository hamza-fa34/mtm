import { Body, Controller, Get, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  async findIngredients() {
    return this.inventoryService.findIngredients();
  }

  @Get('purchases')
  async findPurchases() {
    return this.inventoryService.findPurchases();
  }

  @Get('wastes')
  async findWastes() {
    return this.inventoryService.findWastes();
  }

  @Post('purchases')
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
