import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['draft', 'penawaran', 'deal', 'dikerjakan', 'selesai', 'batal'])
  status: 'draft' | 'penawaran' | 'deal' | 'dikerjakan' | 'selesai' | 'batal';

  // Harga kesepakatan, wajib ada saat status jadi deal (kalau belum ada harga tawar)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalPrice?: number;
}