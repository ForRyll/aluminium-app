import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CALC_ENTITIES } from './calculator.entities';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature(CALC_ENTITIES), OrdersModule],
  controllers: [CalculatorController],
  providers: [CalculatorService],
  exports: [TypeOrmModule],
})
export class CalculatorModule {}