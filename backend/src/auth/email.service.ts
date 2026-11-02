import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly appUrl: string;
  private readonly from: string;
  private readonly nodeEnv: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');

    this.resend = apiKey ? new Resend(apiKey) : null;
    this.appUrl = config.getOrThrow<string>('APP_URL');
    this.from = config.getOrThrow<string>('EMAIL_FROM');
    this.nodeEnv = config.getOrThrow<string>('NODE_ENV');
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${this.appUrl}/verify-email?token=${encodeURIComponent(token)}`;

    // В development ссылка нужна даже при настроенном Resend:
    // иначе письмо уходит наружу, а локально проверить flow нечем.
    if (this.nodeEnv !== 'production') {
      this.logger.warn(
        `[dev] Ссылка подтверждения для ${email}: ${verificationUrl}`,
      );
    }

    if (!this.resend) {
      if (this.nodeEnv === 'production') {
        this.logger.error(
          'RESEND_API_KEY не задан: письмо с подтверждением не отправлено',
        );
      }

      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Подтвердите email в Pulse',
      text: `Привет, ${name}!\n\nПодтвердите email: ${verificationUrl}\n\nСсылка действует 24 часа.`,
      html: `<p>Привет, ${this.escapeHtml(name)}!</p><p>Подтвердите email в Pulse:</p><p><a href="${verificationUrl}">Подтвердить email</a></p><p>Ссылка действует 24 часа.</p>`,
    });

    if (error) {
      throw new Error(`Resend: ${error.message}`);
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
