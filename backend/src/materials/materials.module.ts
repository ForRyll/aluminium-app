import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { MaterialsBulkController } from './materials-bulk.controller';
import { MaterialsBulkService } from './materials-bulk.service';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

@Module({
  imports: [TypeOrmModule.forFeature([Material])],
  controllers: [MaterialsController, MaterialsBulkController],
  providers: [MaterialsService, MaterialsBulkService],
})
export class MaterialsModule {}