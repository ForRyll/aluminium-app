import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';

// Dijaga penjaga login global, jadi tanpa token otomatis ditolak
@Controller('export')
export class ExportController {
  constructor(private readonly exporter: ExportService) {}

  // Nama yang diizinkan: orders.csv, payments.csv, customers.csv, materials.csv, backup.json
  @Get(':name')
  async file(
    @Param('name') name: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.exporter.build(name);
    res.set({
      'Content-Type': out.type,
      'Content-Disposition': `attachment; filename="${out.fileName}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(out.data);
  }
}