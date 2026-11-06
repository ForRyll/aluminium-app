import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// Data pendamping foto yang diunggah
export class UploadPhotoDto {
  @IsIn(['sebelum', 'proses', 'sesudah'])
  kind: 'sebelum' | 'proses' | 'sesudah';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;
}