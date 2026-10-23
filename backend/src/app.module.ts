import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { MaterialsModule } from './materials/materials.module';
import { OrdersModule } from './orders/orders.module';

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
        // Hanya menyala di laptop (DB_SYNC=true). Di server online harus false,
        // karena synchronize bisa menghapus data kalau struktur tabel berubah.
        synchronize: config.get<string>('DB_SYNC') === 'true',
      }),
    }),

    MaterialsModule,
    CustomersModule,
    OrdersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}