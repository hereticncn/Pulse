import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Укажите имя').max(100, 'Имя слишком длинное'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Некорректный email')
    .max(254, 'Email слишком длинный'),
  password: z
    .string()
    .min(12, 'Пароль должен быть не короче 12 символов')
    .max(128, 'Пароль слишком длинный'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
