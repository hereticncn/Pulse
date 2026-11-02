import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import type { ApiErrorBody } from '../errors/api-error.js';

interface ErrorResponse {
  status: number;
  body: { error: ApiErrorBody };
}

function errorBody(
  code: string,
  message: string,
  details: unknown[] = [],
): { error: ApiErrorBody } {
  return { error: { code, message, details } };
}

function codeForStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_ERROR';
    case HttpStatus.UNAUTHORIZED:
      return 'AUTH_REQUIRED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    default:
      return 'HTTP_ERROR';
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as ApiErrorBody).code === 'string' &&
    typeof (value as ApiErrorBody).message === 'string'
  );
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toResponse(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(body);
  }

  private toResponse(exception: unknown): ErrorResponse {
    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        body: errorBody(
          'RATE_LIMITED',
          'Слишком много запросов. Попробуйте позже.',
        ),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'object' && payload !== null) {
        const payloadError = (payload as { error?: unknown }).error;

        if (isApiErrorBody(payloadError)) {
          return { status, body: { error: payloadError } };
        }

        const payloadMessage = (payload as { message?: unknown }).message;
        const message =
          typeof payloadMessage === 'string'
            ? payloadMessage
            : exception.message;

        return { status, body: errorBody(codeForStatus(status), message) };
      }

      return {
        status,
        body: errorBody(
          codeForStatus(status),
          typeof payload === 'string' ? payload : exception.message,
        ),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: errorBody('INTERNAL_ERROR', 'Внутренняя ошибка сервера'),
    };
  }
}
