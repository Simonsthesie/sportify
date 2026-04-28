import { signToken, verifyToken } from '../../src/utils/jwt';

describe('utils/jwt', () => {
  it('signe et verifie un token JWT', () => {
    const payload = { sub: 1, email: 'a@b.c', role: 'CLIENT' as const };
    const token = signToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('rejette un token invalide', () => {
    expect(() => verifyToken('not-a-jwt')).toThrow();
  });
});
