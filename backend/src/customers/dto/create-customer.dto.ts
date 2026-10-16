import { IsOptional, IsString, Length, Matches } from 'class-validator';

// Aturan data saat menambah pelanggan baru
export class CreateCustomerDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsOptional()
  @Matches(/^[0-9+\-\s]{8,20}$/, {
    message: 'phone harus berupa nomor telepon yang valid',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}