import { HttpException, HttpStatus } from '@nestjs/common';

interface Entry {
  count: number;
  first: number;
  lockedUntil: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_PER_USER = 5; // per IP + username
const MAX_PER_IP = 30; // per IP, semua username

export class LoginLimiter {
  private entries = new Map<string, Entry>();

  private keys(ip: string, username: string) {
    return [
      { key: `u|${ip}|${username}`, max: MAX_PER_USER },
      { key: `i|${ip}`, max: MAX_PER_IP },
    ];
  }

  // Lempar 429 kalau salah satu kunci sedang terkunci
  assertAllowed(ip: string, username: string, now = Date.now()) {
    this.sweep(now);
    for (const k of this.keys(ip, username)) {
      const e = this.entries.get(k.key);
      if (e && e.lockedUntil > now) {
        const minutes = Math.ceil((e.lockedUntil - now) / 60000);
        throw new HttpException(
          {
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Terlalu banyak percobaan login. Coba lagi sekitar ${minutes} menit lagi.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  recordFailure(ip: string, username: string, now = Date.now()) {
    for (const k of this.keys(ip, username)) {
      let e = this.entries.get(k.key);
      // Mulai hitungan baru kalau jendela habis atau kunci sudah lewat
      if (!e || now - e.first > WINDOW_MS || (e.lockedUntil > 0 && e.lockedUntil <= now)) {
        e = { count: 0, first: now, lockedUntil: 0 };
      }
      e.count++;
      if (e.count >= k.max) e.lockedUntil = now + LOCK_MS;
      this.entries.set(k.key, e);
    }
  }

  // Login berhasil: hapus hitungan salah untuk kombinasi ini
  recordSuccess(ip: string, username: string) {
    this.entries.delete(`u|${ip}|${username}`);
  }

  // Bersihkan data kedaluwarsa supaya memori tidak membengkak
  private sweep(now: number) {
    if (this.entries.size < 500) return;
    for (const [k, e] of this.entries) {
      if (now - e.first > WINDOW_MS && e.lockedUntil <= now) this.entries.delete(k);
    }
  }
}

// Satu pembatas untuk seluruh aplikasi
export const loginLimiter = new LoginLimiter();