import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Material } from '../materials/entities/material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Customer, Material])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}