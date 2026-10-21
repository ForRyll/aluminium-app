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