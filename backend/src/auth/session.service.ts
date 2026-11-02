import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Session, User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SESSION_TOUCH_INTERVAL_MS, SESSION_TTL_MS } from './auth.constants.js';
import { TokenService } from './token.service.js';

export interface CreatedSession {
  token: string;
  session: Session;
}

export interface ValidatedSession {
  session: Session;
  user: User;
}

@Injectable()
export class SessionService {
  private readonly ipHashSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    config: ConfigService,
  ) {
    this.ipHashSecret = config.getOrThrow<string>('SESSION_SECRET');
  }

  async create(
    userId: string,
    ip: string | undefined,
    userAgent: string | undefined,
  ): Promise<CreatedSession> {
    const token = this.tokens.create();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.tokens.hash(token),
        expiresAt,
        ipHash: ip ? this.hashIp(ip) : null,
        userAgent: userAgent?.slice(0, 500) ?? null,
      },
    });

    return { token, session };
  }

  async validate(rawToken: string): Promise<ValidatedSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.tokens.hash(rawToken) },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt.getTime() <= Date.now() ||
      session.user.deletedAt !== null
    ) {
      return null;
    }

    if (Date.now() - session.lastUsedAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return { session, user: session.user };
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashIp(ip: string): string {
    return createHmac('sha256', this.ipHashSecret).update(ip).digest('hex');
  }
}
