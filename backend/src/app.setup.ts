import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';

/**
 * Общая настройка HTTP-слоя для main.ts и e2e-тестов.
 * Так тесты проверяют тот же префикс, cookie-parser, helmet и CORS.
 */
export function configureApp(
  app: INestApplication,
  config: ConfigService,
): void {
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('APP_URL'),
    credentials: true,
  });
  app.useGlobalFilters(new ApiExceptionFilter());
}
