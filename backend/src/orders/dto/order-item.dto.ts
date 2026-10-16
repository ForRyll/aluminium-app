import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

// Satu komponen dalam order. Dua cara pengisian:
// 1) dari katalog: cukup materialId + quantity
// 2) bebas: description + unit + unitPrice + quantity
export class OrderItemDto {
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  unit?: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  // Kalau diisi, menimpa harga katalog (mis. harga khusus)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number;
}