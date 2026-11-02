import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { EmailService } from '../src/auth/email.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

type TestAgent = ReturnType<typeof request.agent>;

const PASSWORD = 'correct horse battery staple';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let agent: TestAgent;
  let csrfToken: string;
  let verificationTokens: string[];
  let databaseReady = false;

  beforeAll(async () => {
    verificationTokens = [];

    const emailService = {
      sendVerificationEmail: async (
        _email: string,
        _name: string,
        token: string,
      ): Promise<void> => {
        verificationTokens.push(token);
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(emailService)
      .compile();

    const config = moduleFixture.get(ConfigService);
    const databaseUrl = config.getOrThrow<string>('DATABASE_URL');

    // Защита от случайной очистки dev-базы: e2e удаляет все таблицы.
    if (!/test/i.test(databaseUrl)) {
      throw new Error(
        'E2E требует отдельную тестовую БД: в DATABASE_URL имя базы должно содержать "test". ' +
          'Пример: DATABASE_URL=postgresql://pulse:pulse@localhost:5432/pulse_test npm run test:e2e',
      );
    }

    app = moduleFixture.createNestApplication();
    configureApp(app, config);
    await app.init();

    prisma = app.get(PrismaService);
    await clearDatabase();
    databaseReady = true;
  });

  afterAll(async () => {
    if (databaseReady) {
      await clearDatabase();
    }

    if (app) {
      await app.close();
    }
  });

  async function clearDatabase(): Promise<void> {
    await prisma.membership.deleteMany();
    await prisma.session.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
  }

  async function refreshCsrfToken(): Promise<void> {
    const response = await agent.get('/api/v1/auth/csrf').expect(200);

    csrfToken = response.body.csrfToken as string;
  }

  function lastVerificationToken(): string {
    const token = verificationTokens.at(-1);

    if (!token) {
      throw new Error('EmailService не получил токен подтверждения');
    }

    return token;
  }

  it('проходит путь register → verify → login → me → logout', async () => {
    agent = request.agent(app.getHttpServer());
    await refreshCsrfToken();

    await agent
      .post('/api/v1/auth/register')
      .set('x-csrf-token', csrfToken)
      .send({
        name: 'Test User',
        email: 'Test@Example.com',
        password: PASSWORD,
      })
      .expect(201);

    expect(verificationTokens).toHaveLength(1);
    const verificationToken = lastVerificationToken();

    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    expect(user).not.toBeNull();
    expect(user?.emailVerifiedAt).toBeNull();
    expect(user?.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(user?.passwordHash).not.toContain(PASSWORD);

    const storedToken = await prisma.emailVerificationToken.findFirst({
      where: { userId: user?.id },
    });

    expect(storedToken).not.toBeNull();
    expect(storedToken?.tokenHash).not.toBe(verificationToken);

    await agent
      .post('/api/v1/auth/login')
      .set('x-csrf-token', csrfToken)
      .send({ email: 'test@example.com', password: PASSWORD })
      .expect(403)
      .expect((response) => {
        expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
      });

    await agent
      .post('/api/v1/auth/verify-email')
      .set('x-csrf-token', csrfToken)
      .send({ token: verificationToken })
      .expect(204);

    const loginResponse = await agent
      .post('/api/v1/auth/login')
      .set('x-csrf-token', csrfToken)
      .send({ email: 'test@example.com', password: PASSWORD })
      .expect(200);

    expect(loginResponse.body.user.email).toBe('test@example.com');
    expect(loginResponse.body.user.emailVerified).toBe(true);
    expect(loginResponse.headers['set-cookie']).toBeDefined();

    const sessionCookie = (
      loginResponse.headers['set-cookie'] as unknown as string[]
    ).find((cookie) => cookie.startsWith('pulse_session='));

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');

    const session = await prisma.session.findFirst({
      where: { userId: user?.id },
    });

    expect(session).not.toBeNull();
    expect(session?.revokedAt).toBeNull();

    const meResponse = await agent.get('/api/v1/auth/me').expect(200);

    expect(meResponse.body.user.email).toBe('test@example.com');
    expect(meResponse.body.user.memberships).toEqual([]);
    expect(meResponse.body.user).not.toHaveProperty('passwordHash');

    await agent
      .post('/api/v1/auth/logout')
      .set('x-csrf-token', csrfToken)
      .expect(204);

    await agent.get('/api/v1/auth/me').expect(401);

    const revokedSession = await prisma.session.findFirst({
      where: { userId: user?.id },
    });

    expect(revokedSession?.revokedAt).not.toBeNull();
  });

  it('инвалидирует старый токен при повторной регистрации и не шлёт письмо подтверждённому email', async () => {
    const localAgent = request.agent(app.getHttpServer());
    const csrfResponse = await localAgent.get('/api/v1/auth/csrf').expect(200);
    const localCsrf = csrfResponse.body.csrfToken as string;

    const register = () =>
      localAgent
        .post('/api/v1/auth/register')
        .set('x-csrf-token', localCsrf)
        .send({
          name: 'Repeat User',
          email: 'repeat@example.com',
          password: PASSWORD,
        })
        .expect(201);

    const sentBefore = verificationTokens.length;

    await register();
    const firstToken = lastVerificationToken();

    await register();
    const secondToken = lastVerificationToken();

    expect(firstToken).not.toBe(secondToken);
    expect(verificationTokens).toHaveLength(sentBefore + 2);

    await localAgent
      .post('/api/v1/auth/verify-email')
      .set('x-csrf-token', localCsrf)
      .send({ token: firstToken })
      .expect(400)
      .expect((response) => {
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });

    await localAgent
      .post('/api/v1/auth/verify-email')
      .set('x-csrf-token', localCsrf)
      .send({ token: secondToken })
      .expect(204);

    const user = await prisma.user.findUnique({
      where: { email: 'repeat@example.com' },
    });

    expect(user).not.toBeNull();
    expect(user?.emailVerifiedAt).not.toBeNull();

    const tokensBefore = await prisma.emailVerificationToken.count({
      where: { userId: user?.id },
    });

    await register();

    expect(verificationTokens).toHaveLength(sentBefore + 2);
    expect(
      await prisma.emailVerificationToken.count({
        where: { userId: user?.id },
      }),
    ).toBe(tokensBefore);
  });

  it('отклоняет state-changing запрос без CSRF-токена', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: 'a'.repeat(32) })
      .expect(403)
      .expect((response) => {
        expect(response.body.error.code).toBe('CSRF_INVALID');
      });
  });

  it('отклоняет вход с неверным паролем', async () => {
    const localAgent = request.agent(app.getHttpServer());
    const csrfResponse = await localAgent.get('/api/v1/auth/csrf').expect(200);
    const localCsrf = csrfResponse.body.csrfToken as string;

    await localAgent
      .post('/api/v1/auth/login')
      .set('x-csrf-token', localCsrf)
      .send({ email: 'test@example.com', password: 'wrong password value' })
      .expect(401)
      .expect((response) => {
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      });
  });
});
