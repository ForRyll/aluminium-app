import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CALC_ENTITIES } from './calculator.entities';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature(CALC_ENTITIES), OrdersModule],
  controllers: [CalculatorController, PricingController, RecipesController],
  providers: [CalculatorService, PricingService, RecipesService],
  exports: [TypeOrmModule],
})
export class CalculatorModule {}