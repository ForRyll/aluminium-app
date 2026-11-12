import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Aturan data untuk perubahan harga massal
export class BulkPriceDto {
  // Filter. Minimal satu harus diisi, atau all = true.
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @IsOptional()
  @IsBoolean()
  all?: boolean;

  // percent: value = persen (boleh negatif). amount: value = rupiah per satuan (boleh negatif).
  @IsIn(['percent', 'amount'])
  mode: 'percent' | 'amount';

  @IsNumber({ maxDecimalPlaces: 2 })
  value: number;

  // Pembulatan harga baru ke kelipatan rupiah ini. 0 = tidak dibulatkan.
  @IsIn([0, 100, 500, 1000])
  rounding: 0 | 100 | 500 | 1000;

  // false (atau tidak dikirim) = hanya pratinjau. true = simpan.
  @IsOptional()
  @IsBoolean()
  apply?: boolean;
}