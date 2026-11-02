import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный email').max(254),
  password: z.string().min(1, 'Введите пароль').max(128),
});

export type LoginDto = z.infer<typeof loginSchema>;
