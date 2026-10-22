import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

// Semua kolom opsional. Pelanggan tidak bisa diganti lewat edit.
export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ['customerId'] as const),
) {}