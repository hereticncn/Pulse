import { SetMetadata } from '@nestjs/common';

export const CSRF_EXEMPT_KEY = 'csrfExempt';

/**
 * Точечное исключение из CSRF-проверки.
 * Нужно для будущих webhook'ов, которые приходят без cookie.
 */
export const CsrfExempt = () => SetMetadata(CSRF_EXEMPT_KEY, true);
