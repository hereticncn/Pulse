import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError } from '../common/errors/api-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  EMAIL_VERIFICATION_TTL_MS,
  REGISTER_RESPONSE_MESSAGE,
} from './auth.constants.js';
import {
  toPublicUser,
  type MembershipSummary,
  type PublicUser,
} from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { VerifyEmailDto } from './dto/verify-email.dto.js';
import { EmailService } from './email.service.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';
import { TokenService } from './token.service.js';

export interface LoginResult {
  token: string;
  expiresAt: Date;
  user: PublicUser;
}

export interface MeResult {
  user: PublicUser & { memberships: MembershipSummary[] };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly isProduction: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly email: EmailService,
    config: ConfigService,
  ) {
    this.isProduction = config.getOrThrow<string>('NODE_ENV') === 'production';
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    // Хешируем пароль всегда, чтобы регистрация существующего email
    // не отвечала заметно быстрее регистрации нового.
    const passwordHash = await this.passwords.hash(dto.password);
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      if (existing.deletedAt === null && existing.emailVerifiedAt === null) {
        const token = await this.issueVerificationToken(existing.id);
        await this.sendVerificationEmailSafe(
          existing.email,
          existing.name,
          token,
        );
      } else if (!this.isProduction) {
        // Иначе в dev кажется, что письмо потерялось: ответ всегда
        // generic, а письма для подтверждённого email нет по дизайну.
        this.logger.warn(
          `[dev] ${dto.email} уже подтверждён или удалён: письмо не отправляется`,
        );
      }

      return { message: REGISTER_RESPONSE_MESSAGE };
    }

    const token = this.tokens.create();

    try {
      await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            name: dto.name,
            passwordHash,
          },
        });

        await tx.emailVerificationToken.create({
          data: {
            userId: user.id,
            tokenHash: this.tokens.hash(token),
            expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
          },
        });
      });
    } catch (error) {
      // Гонка двух одновременных регистраций: второй запрос получает
      // тот же generic-ответ, что и регистрация существующего email.
      if (isUniqueConstraintError(error)) {
        return { message: REGISTER_RESPONSE_MESSAGE };
      }

      throw error;
    }

    await this.sendVerificationEmailSafe(dto.email, dto.name, token);

    return { message: REGISTER_RESPONSE_MESSAGE };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: this.tokens.hash(dto.token) },
    });

    if (
      !record ||
      record.usedAt !== null ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      throw this.invalidTokenError();
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.emailVerificationToken.updateMany({
        where: {
          id: record.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (consumed.count === 0) {
        throw this.invalidTokenError();
      }

      // Остальные неиспользованные токены этого пользователя больше не нужны.
      await tx.emailVerificationToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: now },
      });

      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: now },
      });
    });
  }

  async login(
    dto: LoginDto,
    ip: string | undefined,
    userAgent: string | undefined,
  ): Promise<LoginResult> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user) {
      await this.passwords.verifyDummy(dto.password);
      throw this.invalidCredentialsError();
    }

    const passwordValid = await this.passwords.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordValid) {
      throw this.invalidCredentialsError();
    }

    if (user.emailVerifiedAt === null) {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'EMAIL_NOT_VERIFIED',
        'Подтвердите email, чтобы войти',
      );
    }

    const { token, session } = await this.sessions.create(
      user.id,
      ip,
      userAgent,
    );

    return {
      token,
      expiresAt: session.expiresAt,
      user: toPublicUser(user),
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.revoke(sessionId);
  }

  async me(userId: string): Promise<MeResult> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'AUTH_REQUIRED',
        'Требуется вход',
      );
    }

    const memberships: MembershipSummary[] = user.memberships
      .filter((membership) => membership.organization.deletedAt === null)
      .map((membership) => ({
        organizationId: membership.organization.id,
        organizationName: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      }));

    return {
      user: {
        ...toPublicUser(user),
        memberships,
      },
    };
  }

  private async issueVerificationToken(userId: string): Promise<string> {
    const token = this.tokens.create();
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: this.tokens.hash(token),
          expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        },
      }),
    ]);

    return token;
  }

  private async sendVerificationEmailSafe(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    try {
      await this.email.sendVerificationEmail(email, name, token);
    } catch (error) {
      // Не раскрываем существование аккаунта через 500.
      this.logger.error(
        `Не удалось отправить письмо подтверждения: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private invalidTokenError(): ApiError {
    return new ApiError(
      HttpStatus.BAD_REQUEST,
      'INVALID_TOKEN',
      'Ссылка подтверждения недействительна или истекла',
    );
  }

  private invalidCredentialsError(): ApiError {
    return new ApiError(
      HttpStatus.UNAUTHORIZED,
      'INVALID_CREDENTIALS',
      'Неверный email или пароль',
    );
  }
}
