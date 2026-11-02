import type { CookieOptions } from 'express';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
export const CSRF_TTL_MS = 60 * 60 * 1000;

export const SESSION_COOKIE_NAME = 'pulse_session';
export const PRODUCTION_SESSION_COOKIE_NAME = '__Host-pulse_session';
export const CSRF_COOKIE_NAME = 'pulse_csrf';
export const PRODUCTION_CSRF_COOKIE_NAME = '__Host-pulse_csrf';

export const REGISTER_RESPONSE_MESSAGE =
  'Если почта указана верно, мы отправили письмо с подтверждением.';

export function sessionCookieName(isProduction: boolean): string {
  return isProduction ? PRODUCTION_SESSION_COOKIE_NAME : SESSION_COOKIE_NAME;
}

export function csrfCookieName(isProduction: boolean): string {
  return isProduction ? PRODUCTION_CSRF_COOKIE_NAME : CSRF_COOKIE_NAME;
}

/**
 * __Host- cookie требует Secure, поэтому в dev используем обычное имя.
 * HttpOnly не даёт JavaScript прочитать токен сессии.
 */
export function sessionCookieOptions(
  isProduction: boolean,
  secureInDevelopment: boolean,
  expires?: Date,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction || secureInDevelopment,
    sameSite: 'lax',
    path: '/',
    ...(expires ? { expires } : {}),
  };
}
