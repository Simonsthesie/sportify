import { useEffect, useState } from 'react';
import { seancesApi } from '../api/seances';
import { reservationsApi } from '../api/reservations';
import type { Seance } from '../types';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { formatDateTime } from '../utils/dates';

interface Filters {
  q: string;
  lieu: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: Filters = { q: '', lieu: '', dateFrom: '', dateTo: '' };

export default function SeancesPage() {
  const { user } = useAuth();
  const [seances, setSeances] = useState<Seance[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async (f = filters, p = page) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page: p, limit: 20 };
      if (f.q) params.q = f.q;
      if (f.lieu) params.lieu = f.lieu;
      if (f.dateFrom) params.dateFrom = f.dateFrom;
      if (f.dateTo) params.dateTo = f.dateTo;
      const res = await seancesApi.list(params as any);
      setSeances(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(filters, 1);
  };

  const onReset = () => {
    setFilters(emptyFilters);
    setPage(1);
    load(emptyFilters, 1);
  };

  const onPageChange = (p: number) => {
    setPage(p);
    load(filters, p);
  };

  const onReserver = async (id: number) => {
    setBusyId(id);
    setError(null);
    setInfo(null);
    try {
      await reservationsApi.create(id);
      setInfo('Reservation confirmee !');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la reservation');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seances disponibles</h1>
        <p className="text-sm text-slate-500">Recherchez et reservez votre prochaine seance.</p>
      </div>

      {/* Barre de filtres */}
      <form onSubmit={onSearch} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Recherche</label>
          <input className="input" placeholder="Titre, lieu..." value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </div>
        <div>
          <label className="label">Lieu</label>
          <input className="input" placeholder="Salle 1, Box A..." value={filters.lieu}
            onChange={(e) => setFilters({ ...filters, lieu: e.target.value })} />
        </div>
        <div>
          <label className="label">Du</label>
          <input className="input" type="date" value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
        </div>
        <div>
          <label className="label">Au</label>
          <input className="input" type="date" value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="btn-primary">Rechercher</button>
          <button type="button" className="btn-secondary" onClick={onReset}>Reinitialiser</button>
          <span className="ml-auto text-sm text-slate-500 self-center">
            {pagination.total} seance{pagination.total > 1 ? 's' : ''} trouvee{pagination.total > 1 ? 's' : ''}
          </span>
        </div>
      </form>

      {error && <Alert type="error">{error}</Alert>}
      {info && <Alert type="success">{info}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : seances.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune seance ne correspond aux criteres.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {seances.map((s) => {
              const past = new Date(s.dateDebut).getTime() < Date.now();
              const full = s.placesRestantes <= 0;
              return (
                <div key={s.id} className="card flex flex-col">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{s.titre}</h2>
                    <span className={'badge ' + (full ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                      {s.placesRestantes}/{s.capaciteMax}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {s.coach.utilisateur.prenom} {s.coach.utilisateur.nom} - {s.coach.specialite}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {formatDateTime(s.dateDebut)} - {formatDateTime(s.dateFin)}
                  </p>
                  {s.lieu && <p className="text-sm text-slate-500">Lieu: {s.lieu}</p>}
                  {s.description && <p className="mt-2 text-sm text-slate-600">{s.description}</p>}
                  {user?.role === 'CLIENT' && (
                    <div className="mt-auto pt-4">
                      <button className="btn-primary w-full"
                        onClick={() => onReserver(s.id)}
                        disabled={past || full || busyId === s.id}>
                        {past ? 'Terminee' : full ? 'Complete' : busyId === s.id ? 'Reservation...' : 'Reserver'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                Precedent
              </button>
              <span className="text-sm text-slate-600">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button className="btn-secondary" disabled={page >= pagination.totalPages} onClick={() => onPageChange(page + 1)}>
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
