import { IsOptional, Matches } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Tanggal format YYYY-MM-DD. Tidak dikirim berarti tidak diubah, null berarti dikosongkan.
export class SetScheduleDto {
  @IsOptional()
  @Matches(DATE, { message: 'startDate harus berformat YYYY-MM-DD' })
  startDate?: string | null;

  @IsOptional()
  @Matches(DATE, { message: 'dueDate harus berformat YYYY-MM-DD' })
  dueDate?: string | null;
}