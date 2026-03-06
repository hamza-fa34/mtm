import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesGuard } from './auth/roles.guard';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SettingsModule } from './settings/settings.module';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    CategoriesModule,
    CustomersModule,
    ProductsModule,
    SettingsModule,
    OrdersModule,
    InventoryModule,
    SessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RolesGuard],
})
export class AppModule {}
