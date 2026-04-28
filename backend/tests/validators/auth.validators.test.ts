import { loginSchema, registerSchema } from '../../src/modules/auth/auth.validators';

describe('validators/auth', () => {
  it('accepte un register valide', () => {
    const r = registerSchema.safeParse({
      email: 'test@test.fr',
      motDePasse: 'Password123!',
      nom: 'Doe',
      prenom: 'John',
    });
    expect(r.success).toBe(true);
  });

  it('refuse un email invalide', () => {
    const r = registerSchema.safeParse({
      email: 'pas-un-email',
      motDePasse: 'Password123!',
      nom: 'Doe',
      prenom: 'John',
    });
    expect(r.success).toBe(false);
  });

  it('refuse un mot de passe trop court', () => {
    const r = registerSchema.safeParse({
      email: 'test@test.fr',
      motDePasse: '123',
      nom: 'Doe',
      prenom: 'John',
    });
    expect(r.success).toBe(false);
  });

  it('valide un login basique', () => {
    expect(loginSchema.safeParse({ email: 'user@test.fr', motDePasse: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'user@test.fr', motDePasse: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'pas-email', motDePasse: 'x' }).success).toBe(false);
  });
});
