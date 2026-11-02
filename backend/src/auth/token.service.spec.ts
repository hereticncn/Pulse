import { TokenService } from './token.service.js';

describe('TokenService', () => {
  const service = new TokenService();

  it('создаёт разные непрозрачные токены', () => {
    const first = service.create();
    const second = service.create();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
  });

  it('хеширует токен стабильно и не хранит его в открытом виде', () => {
    const token = service.create();
    const hash = service.hash(token);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(service.hash(token));
    expect(hash).not.toBe(token);
  });
});
