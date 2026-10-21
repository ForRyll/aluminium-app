import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto, SetupDto } from './auth.dto';
import { hashPassword, verifyPassword } from './password';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  // Membuat admin pertama. Otomatis terkunci kalau sudah ada user.
  async setup(dto: SetupDto) {
    if ((await this.users.count()) > 0) {
      throw new ForbiddenException('Admin sudah dibuat, setup dikunci');
    }
    const user = this.users.create({
      username: dto.username,
      passwordHash: await hashPassword(dto.password),
    });
    await this.users.save(user);
    return { message: `Admin "${dto.username}" berhasil dibuat` };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOneBy({ username: dto.username });
    const ok = user
      ? await verifyPassword(dto.password, user.passwordHash)
      : false;

    // Pesan sengaja sama untuk username salah dan password salah
    if (!user || !ok) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
    });
    return { accessToken };
  }
}