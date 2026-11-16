import { Body, Controller, Get, Post } from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { CalculateDto, ToOrderDto } from './calculator.dto';

@Controller('calculator')
export class CalculatorController {
  constructor(private readonly service: CalculatorService) {}

  @Get('options')
  options() {
    return this.service.options();
  }

  @Post('calculate')
  calculate(@Body() dto: CalculateDto) {
    return this.service.calculate(dto);
  }

  @Post('to-order')
  toOrder(@Body() dto: ToOrderDto) {
    return this.service.toOrder(dto);
  }
}