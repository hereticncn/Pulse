import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { sessionCookieName, sessionCookieOptions } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
  PublicUser,
} from './auth.types.js';
import { CsrfService } from './csrf.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';
import { registerSchema, type RegisterDto } from './dto/register.dto.js';
import {
  verifyEmailSchema,
  type VerifyEmailDto,
} from './dto/verify-email.dto.js';

@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;
  private readonly secureInDevelopment: boolean;
  private readonly sessionCookie: string;

  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
    config: ConfigService,
  ) {
    this.isProduction = config.get<string>('NODE_ENV') === 'production';
    this.secureInDevelopment = config.get<boolean>('COOKIE_SECURE') === true;
    this.sessionCookie = sessionCookieName(this.isProduction);
  }

  @Public()
  @Get('csrf')
  getCsrf(@Res({ passthrough: true }) response: Response): {
    csrfToken: string;
  } {
    return { csrfToken: this.csrfService.issue(response) };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
  ): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema)) dto: VerifyEmailDto,
  ): Promise<void> {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: PublicUser }> {
    const result = await this.authService.login(
      dto,
      request.ip,
      request.get('user-agent'),
    );

    response.cookie(
      this.sessionCookie,
      result.token,
      sessionCookieOptions(
        this.isProduction,
        this.secureInDevelopment,
        result.expiresAt,
      ),
    );

    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(request.session.id);

    response.clearCookie(
      this.sessionCookie,
      sessionCookieOptions(this.isProduction, this.secureInDevelopment),
    );
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }
}
