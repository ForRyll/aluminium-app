import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

// Aturan data yang boleh masuk saat menambah material baru
export class CreateMaterialDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsString()
  @Length(2, 50)
  category: string; // profil, kaca, aksesoris, upah, dll

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsString()
  @Length(1, 20)
  unit: string; // batang, meter, lembar, pcs

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  lengthPerUnit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}