import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Semua input dicek otomatis berdasarkan aturan di DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // buang field yang tidak dikenal
      forbidNonWhitelisted: true, // tolak request yang bawa field asing
      transform: true, // ubah tipe otomatis (mis. "5" jadi angka 5)
    }),
  );

  // Hanya alamat yang terdaftar di CORS_ORIGIN yang boleh memanggil API dari browser.
  // Boleh lebih dari satu, dipisah koma.
  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({ origin: origins });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();