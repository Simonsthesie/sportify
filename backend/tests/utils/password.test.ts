import { hashPassword, comparePassword } from '../../src/utils/password';

describe('utils/password', () => {
  it('hash un mot de passe et le verifie', async () => {
    const plain = 'Password123!';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.length).toBeGreaterThan(20);

    expect(await comparePassword(plain, hash)).toBe(true);
    expect(await comparePassword('mauvais', hash)).toBe(false);
  });
});
