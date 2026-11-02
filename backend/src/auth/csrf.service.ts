import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CSRF_TTL_MS, csrfCookieName } from './auth.constants.js';

function safeEqual(first: string, second: string): boolean {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return (
    firstBuffer.length === secondBuffer.length &&
    timingSafeEqual(firstBuffer, secondBuffer)
  );
}

/**
 * Double-submit cookie без серверного хранилища:
 * - GET /auth/csrf кладёт подписанный токен в HttpOnly cookie и отдаёт его в JSON;
 * - state-changing запрос обязан прислать тот же токен в X-CSRF-Token.
 */
@Injectable()
export class CsrfService {
  private readonly secret: string;
  private readonly cookieName: string;
  private readonly secure: boolean;

  constructor(config: ConfigService) {
    this.secret = config.getOrThrow<string>('CSRF_SECRET');

    const isProduction = config.get<string>('NODE_ENV') === 'production';
    this.cookieName = csrfCookieName(isProduction);
    this.secure = isProduction || config.get<boolean>('COOKIE_SECURE') === true;
  }

  issue(response: Response): string {
    const nonce = randomBytes(32).toString('base64url');
    const token = `${nonce}.${this.sign(nonce)}`;

    response.cookie(this.cookieName, token, {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: '/',
      maxAge: CSRF_TTL_MS,
    });

    return token;
  }

  isValid(request: Request): boolean {
    const cookieToken: unknown = request.cookies?.[this.cookieName];
    const headerValue = request.headers['x-csrf-token'];
    const headerToken = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
      return false;
    }

    return (
      safeEqual(cookieToken, headerToken) && this.hasValidSignature(cookieToken)
    );
  }

  private sign(nonce: string): string {
    return createHmac('sha256', this.secret).update(nonce).digest('base64url');
  }

  private hasValidSignature(token: string): boolean {
    const separatorIndex = token.indexOf('.');
    if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
      return false;
    }

    const nonce = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);

    return safeEqual(this.sign(nonce), signature);
  }
}
