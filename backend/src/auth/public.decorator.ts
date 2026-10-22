import { SetMetadata } from '@nestjs/common';

// Penanda untuk endpoint yang boleh dibuka tanpa login
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
