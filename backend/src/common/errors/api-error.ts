import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown[];
}

/**
 * Единый формат ошибок API:
 * { "error": { "code": "AUTH_REQUIRED", "message": "...", "details": [] } }
 *
 * Фронтенд ориентируется на code, а не на текст сообщения.
 */
export class ApiError extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    details: unknown[] = [],
  ) {
    super({ error: { code, message, details } }, status);
  }
}
