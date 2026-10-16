import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    // Izinkan frontend SvelteKit (mode dev) memanggil API
  app.enableCors({ origin: 'http://localhost:5173' });

  // Semua input dicek otomatis berdasarkan aturan di DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // buang field yang tidak dikenal
      forbidNonWhitelisted: true, // tolak request yang bawa field asing
      transform: true, // ubah tipe otomatis (mis. "5" jadi angka 5)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();