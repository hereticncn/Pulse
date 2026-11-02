import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CsrfService } from './csrf.service.js';
import { EmailService } from './email.service.js';
import { CsrfGuard } from './guards/csrf.guard.js';
import { EmailVerifiedGuard } from './guards/email-verified.guard.js';
import { SessionAuthGuard } from './guards/session-auth.guard.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';
import { TokenService } from './token.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    EmailService,
    CsrfService,
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_GUARD, useClass: EmailVerifiedGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  exports: [EmailService],
})
export class AuthModule {}
