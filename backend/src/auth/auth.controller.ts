import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { LoginDto, SetupDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Membuat admin pertama (terkunci setelah admin ada)
  @Post('setup')
  setup(@Body() dto: SetupDto) {
    return this.auth.setup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Untuk mengecek token: siapa yang sedang login
  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: { user?: unknown }) {
    return req.user;
  }
}