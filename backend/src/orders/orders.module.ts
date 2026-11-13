import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Material } from '../materials/entities/material.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderPhoto } from './entities/order-photo.entity';
import { Order } from './entities/order.entity';
import { Payment } from './entities/payment.entity';
import { OrderListController } from './order-list.controller';
import { OrderListService } from './order-list.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Customer,
      Material,
      Payment,
      OrderPhoto,
    ]),
  ],
  controllers: [
    OrdersController,
    PaymentsController,
    PhotosController,
    ScheduleController,
    OrderListController,
  ],
  providers: [
    OrdersService,
    PaymentsService,
    PhotosService,
    ScheduleService,
    OrderListService,
  ],
})
export class OrdersModule {}