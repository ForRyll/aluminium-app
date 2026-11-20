import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { loginLimiter } from './login-limiter';

// Dipasang di endpoint login: cek kunci dulu, catat hasilnya sesudahnya
@Injectable()
export class LoginThrottleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const ip = String(req.ip ?? 'unknown');
    const username = String(req.body?.username ?? '').trim().toLowerCase().slice(0, 100);

    loginLimiter.assertAllowed(ip, username);

    return next.handle().pipe(
      tap(() => loginLimiter.recordSuccess(ip, username)),
      catchError((err) => {
        if (err instanceof UnauthorizedException) loginLimiter.recordFailure(ip, username);
        return throwError(() => err);
      }),
    );
  }
}