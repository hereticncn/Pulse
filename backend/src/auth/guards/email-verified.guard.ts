import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiError } from '../../common/errors/api-error.js';
import type { AuthenticatedRequest } from '../auth.types.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

/**
 * Публичные действия (голос, комментарий, feedback) требуют
 * подтверждённого email, но не требуют Membership.
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'AUTH_REQUIRED',
        'Требуется вход',
      );
    }

    if (request.user.emailVerifiedAt === null) {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'EMAIL_NOT_VERIFIED',
        'Подтвердите email, чтобы продолжить',
      );
    }

    return true;
  }
}
