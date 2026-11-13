import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Parameter pencarian di daftar order. Parameter yang tidak dikenal ditolak.
export class OrderListQueryDto {
  // Kata kunci: nomor order, nama pekerjaan, atau nama pelanggan
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(['draft', 'penawaran', 'deal', 'dikerjakan', 'selesai', 'batal'])
  status?: 'draft' | 'penawaran' | 'deal' | 'dikerjakan' | 'selesai' | 'batal';

  // 1 = hanya yang masih ada sisa tagihan
  @IsOptional()
  @IsIn(['1'])
  unpaid?: '1';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number;
}