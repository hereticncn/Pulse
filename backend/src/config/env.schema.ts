import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
  VOTE_HASH_SECRET: z.string().min(32),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().min(1).default('Pulse <no-reply@example.com>'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Валидирует окружение один раз на старте приложения.
 * Если переменной не хватает или она неверного формата, приложение
 * падает сразу с понятным сообщением, а не через 500 на первом запросе.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Некорректные переменные окружения: ${details}`);
  }

  return parsed.data;
}
