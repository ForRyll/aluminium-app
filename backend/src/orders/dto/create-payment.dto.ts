import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// Aturan data saat mencatat pembayaran
export class CreatePaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  // Format YYYY-MM-DD. Kalau kosong, dipakai tanggal hari ini.
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsIn(['tunai', 'transfer', 'lainnya'])
  method: 'tunai' | 'transfer' | 'lainnya';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}