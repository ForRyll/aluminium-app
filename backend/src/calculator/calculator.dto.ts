import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min,
} from 'class-validator';

export class CalculateDto {
  @IsString() productCode: string;

  @Type(() => Number) @IsNumber() @Min(10) @Max(1000) L: number; // lebar cm
  @Type(() => Number) @IsNumber() @Min(10) @Max(1000) T: number; // tinggi cm
  @Type(() => Number) @IsNumber() @Min(1) @Max(10) S: number; // jumlah daun

  @IsString() brand: string;
  @IsIn(['meter', 'bar']) mode: 'meter' | 'bar';

  @IsOptional() @IsString() glassId?: string;
  @IsOptional() @IsString() finishing?: string; // nama finishing
  @IsOptional() @IsBoolean() complex?: boolean;
  @IsOptional() @IsBoolean() withInstall?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) includeOptional?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(300) markupPct?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) roundTo?: number;
}

export class ToOrderDto extends CalculateDto {
  @IsOptional() @IsUUID() customerId?: string; // untuk order baru
  @IsOptional() @IsUUID() orderId?: string; // untuk menambah ke order draft/penawaran
  @IsOptional() @IsString() @Length(3, 200) title?: string;
}