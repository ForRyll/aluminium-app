import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MaterialsModule } from './materials/materials.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    // Baca file .env dan bisa dipakai di seluruh aplikasi
    ConfigModule.forRoot({ isGlobal: true }),

    // Koneksi ke PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        // Tabel dibuat otomatis dari kode. HANYA untuk tahap belajar,
        // nanti kita ganti ke migration sebelum dipakai beneran.
        synchronize: true,
      }),
    }),

    MaterialsModule,

    CustomersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}