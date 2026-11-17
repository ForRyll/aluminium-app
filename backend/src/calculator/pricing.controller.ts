import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('calculator/pricing')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Get()
  all() {
    return this.service.all();
  }

  @Post(':kind')
  create(@Param('kind') kind: string, @Body() body: Record<string, unknown>) {
    return this.service.create(kind, body);
  }

  @Patch(':kind/:id')
  update(
    @Param('kind') kind: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.update(kind, id, body);
  }
}