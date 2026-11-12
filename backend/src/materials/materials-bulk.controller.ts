import { Body, Controller, Post } from '@nestjs/common';
import { BulkPriceDto } from './dto/bulk-price.dto';
import { MaterialsBulkService } from './materials-bulk.service';

// Dijaga penjaga login global, jadi tanpa token otomatis ditolak
@Controller('materials')
export class MaterialsBulkController {
  constructor(private readonly bulk: MaterialsBulkService) {}

  // Pratinjau (apply = false) atau terapkan (apply = true) perubahan harga massal
  @Post('bulk-price')
  run(@Body() dto: BulkPriceDto) {
    return this.bulk.run(dto);
  }
}