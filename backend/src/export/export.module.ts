import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Material } from '../materials/entities/material.entity';
import { OrderPhoto } from '../orders/entities/order-photo.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Payment, Customer, Material, OrderPhoto])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}