import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('хеширует пароль Argon2id и проверяет его', async () => {
    const password = 'correct horse battery staple';
    const hash = await service.hash(password);

    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain(password);
    await expect(service.verify(hash, password)).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong password')).resolves.toBe(false);
  });

  it('выполняет фиктивную проверку для несуществующего пользователя', async () => {
    await expect(service.verifyDummy('any password')).resolves.toBeUndefined();
  });
});
