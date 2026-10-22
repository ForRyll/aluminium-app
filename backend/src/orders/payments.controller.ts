import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('orders/:orderId/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  list(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.list(orderId);
  }

  @Post()
  add(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.add(orderId, dto);
  }

  @Delete(':paymentId')
  remove(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentsService.remove(orderId, paymentId);
  }
}