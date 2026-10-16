import {
  Body,
  Controller,
  Get,
  Param,
  ParseFloatPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  // Contoh: /orders/<id>/summary?price=3200000&targetMargin=20
  @Get(':id/summary')
  summary(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('price', new ParseFloatPipe({ optional: true })) price?: number,
    @Query('targetMargin', new ParseFloatPipe({ optional: true }))
    targetMargin?: number,
  ) {
    return this.ordersService.summary(id, price, targetMargin);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
