import { Controller, Get } from '@nestjs/common';
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
}
