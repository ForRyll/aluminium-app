import { IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(50)
  username: string;

  @IsString()
  @MaxLength(100)
  password: string;
}

// Untuk membuat admin pertama. Password minimal 8 karakter.
export class SetupDto {
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'username hanya boleh huruf, angka, titik, strip, dan underscore',
  })
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}

// Untuk mengganti password dari halaman Akun
export class ChangePasswordDto {
  @IsString()
  @MaxLength(100)
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password baru minimal 8 karakter' })
  @MaxLength(100)
  newPassword: string;
}