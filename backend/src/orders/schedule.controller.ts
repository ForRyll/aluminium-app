import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { SetScheduleDto } from './dto/set-schedule.dto';
import { ScheduleService } from './schedule.service';

// Dijaga penjaga login global, jadi tanpa token otomatis ditolak
@Controller()
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  // Atur tanggal mulai dan jatuh tempo satu order
  @Patch('orders/:orderId/schedule')
  set(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: SetScheduleDto,
  ) {
    return this.schedule.set(orderId, dto);
  }

  // Daftar pekerjaan yang mendekati atau melewati jatuh tempo
  @Get('schedule/upcoming')
  upcoming() {
    return this.schedule.upcoming();
  }
}