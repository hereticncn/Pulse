import { z } from 'zod';

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(20, 'Некорректный токен')
    .max(200, 'Некорректный токен'),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
