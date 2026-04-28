import { api } from './client';
import type { Seance, Reservation } from '../types';

export interface SeanceInput {
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  capaciteMax: number;
  lieu?: string;
}

export const seancesApi = {
  list(params?: { q?: string; coachId?: number; lieu?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const qs = params ? '?' + new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    return api<{ data: Seance[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/seances' + qs);
  },
  listMine() {
    return api<Seance[]>('/seances/me');
  },
  getById(id: number) {
    return api<Seance>('/seances/' + id);
  },
  create(input: SeanceInput) {
    return api<Seance>('/seances', { method: 'POST', body: JSON.stringify(input) });
  },
  update(id: number, input: Partial<SeanceInput>) {
    return api<Seance>('/seances/' + id, { method: 'PATCH', body: JSON.stringify(input) });
  },
  remove(id: number) {
    return api<void>('/seances/' + id, { method: 'DELETE' });
  },
  participants(id: number) {
    return api<Reservation[]>('/seances/' + id + '/participants');
  },
};
