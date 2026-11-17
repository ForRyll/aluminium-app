import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CALC_ENTITIES } from './calculator.entities';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature(CALC_ENTITIES), OrdersModule],
  controllers: [CalculatorController, PricingController],
  providers: [CalculatorService, PricingService],
  exports: [TypeOrmModule],
})
export class CalculatorModule {}