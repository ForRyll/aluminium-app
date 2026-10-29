import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

// Dijaga penjaga login global, jadi tanpa token otomatis ditolak
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  get() {
    return this.dashboard.get();
  }
}