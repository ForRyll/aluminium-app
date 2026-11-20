import { Body, Controller, Get, Post, Req, UseInterceptors } from '@nestjs/common';
import { ChangePasswordDto, LoginDto, SetupDto } from './auth.dto';
import { AuthService } from './auth.service';
import { LoginThrottleInterceptor } from './login-throttle.interceptor';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Membuat admin pertama (terkunci setelah admin ada)
  @Public()
  @Post('setup')
  setup(@Body() dto: SetupDto) {
    return this.auth.setup(dto);
  }

  // Dibatasi: 5 kali salah dari IP + username yang sama, lalu terkunci 15 menit
  @Public()
  @Post('login')
  @UseInterceptors(LoginThrottleInterceptor)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Untuk mengecek token: siapa yang sedang login (dijaga penjaga global)
  @Get('me')
  me(@Req() req: { user?: unknown }) {
    return req.user;
  }

  // Ganti password akun yang sedang login
  @Post('change-password')
  changePassword(
    @Req() req: { user?: { sub: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(req.user!.sub, dto);
  }
}