import { Injectable, type OnModuleInit } from '@nestjs/common';
import * as argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  raw: false,
} as const;

@Injectable()
export class PasswordService implements OnModuleInit {
  private dummyHash: Promise<string> | null = null;

  async onModuleInit(): Promise<void> {
    // Заранее считаем фиктивный хеш, чтобы первый login с неизвестным
    // email не отличался по времени от последующих.
    await this.ensureDummyHash();
  }

  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  verify(passwordHash: string, password: string): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }

  /**
   * Считает фиктивный хеш для несуществующего пользователя.
   * Нужно, чтобы login не отвечал заметно быстрее на неизвестный email.
   */
  async verifyDummy(password: string): Promise<void> {
    const hash = await this.ensureDummyHash();
    await argon2.verify(hash, password).catch(() => false);
  }

  private ensureDummyHash(): Promise<string> {
    this.dummyHash ??= this.hash('pulse-dummy-password-never-used');
    return this.dummyHash;
  }
}
