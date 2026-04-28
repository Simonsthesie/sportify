import { createSeanceSchema, updateSeanceSchema } from '../../src/modules/seances/seances.validators';

describe('validators/seances', () => {
  it('accepte une creation valide', () => {
    const r = createSeanceSchema.safeParse({
      titre: 'Yoga',
      dateDebut: '2026-05-01T09:00:00Z',
      dateFin: '2026-05-01T10:00:00Z',
      capaciteMax: 10,
    });
    expect(r.success).toBe(true);
  });

  it('refuse si date_fin <= date_debut', () => {
    const r = createSeanceSchema.safeParse({
      titre: 'Yoga',
      dateDebut: '2026-05-01T10:00:00Z',
      dateFin: '2026-05-01T09:00:00Z',
      capaciteMax: 10,
    });
    expect(r.success).toBe(false);
  });

  it('refuse une capacite <= 0', () => {
    const r = createSeanceSchema.safeParse({
      titre: 'Yoga',
      dateDebut: '2026-05-01T09:00:00Z',
      dateFin: '2026-05-01T10:00:00Z',
      capaciteMax: 0,
    });
    expect(r.success).toBe(false);
  });

  it('accepte un update partiel sans dates', () => {
    const r = updateSeanceSchema.safeParse({ titre: 'Nouveau' });
    expect(r.success).toBe(true);
  });
});
