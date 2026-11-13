import { Controller, Get, Query } from '@nestjs/common';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { OrderListService } from './order-list.service';

// Dijaga penjaga login global, jadi tanpa token otomatis ditolak
@Controller('order-list')
export class OrderListController {
  constructor(private readonly orderList: OrderListService) {}

  // Contoh: /order-list?q=budi&status=deal&unpaid=1&page=2
  @Get()
  get(@Query() query: OrderListQueryDto) {
    return this.orderList.list(query);
  }
}