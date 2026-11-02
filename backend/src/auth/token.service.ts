import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenService {
  /** Непрозрачный токен: 256 бит случайности. */
  create(): string {
    return randomBytes(32).toString('base64url');
  }

  /** В БД хранится только SHA-256 хеш токена. */
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
