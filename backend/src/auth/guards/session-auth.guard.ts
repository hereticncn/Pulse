import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiError } from '../../common/errors/api-error.js';
import { sessionCookieName } from '../auth.constants.js';
import type { AuthenticatedRequest } from '../auth.types.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SessionService } from '../session.service.js';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly cookieName: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    config: ConfigService,
  ) {
    this.cookieName = sessionCookieName(
      config.get<string>('NODE_ENV') === 'production',
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const rawToken: unknown = request.cookies?.[this.cookieName];

    if (typeof rawToken !== 'string' || rawToken.length === 0) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'AUTH_REQUIRED',
        'Требуется вход',
      );
    }

    const validated = await this.sessions.validate(rawToken);

    if (!validated) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'AUTH_REQUIRED',
        'Сессия истекла или недействительна',
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: validated.user.id,
      email: validated.user.email,
      name: validated.user.name,
      emailVerifiedAt: validated.user.emailVerifiedAt,
    };
    authenticatedRequest.session = { id: validated.session.id };

    return true;
  }
}
