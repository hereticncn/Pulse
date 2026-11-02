import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Маршрут доступен без сессии: register, login, verify-email, csrf. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
