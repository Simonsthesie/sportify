import { useEffect, useState } from 'react';
import { usersApi, type AdminUser } from '../api/users';
import { seancesApi } from '../api/seances';
import type { Seance, Role } from '../types';
import Alert from '../components/Alert';
import { formatDateTime } from '../utils/dates';

type Tab = 'users' | 'seances';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, sr] = await Promise.all([usersApi.list(), seancesApi.list()]);
      setUsers(u);
      setSeances(sr.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onUpdateRole = async (id: number, role: Role) => {
    try {
      await usersApi.updateRole(id, role);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const onDeleteUser = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await usersApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const onDeleteSeance = async (id: number) => {
    if (!confirm('Supprimer cette séance ?')) return;
    try {
      await seancesApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Administration</h1>

      <div className="flex gap-2 border-b border-slate-200">
        <button className={'px-4 py-2 text-sm font-medium ' + (tab === 'users' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500')} onClick={() => setTab('users')}>
          Utilisateurs ({users.length})
        </button>
        <button className={'px-4 py-2 text-sm font-medium ' + (tab === 'seances' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500')} onClick={() => setTab('seances')}>
          Toutes les séances ({seances.length})
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : tab === 'users' ? (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2">{u.id}</td>
                  <td>{u.prenom} {u.nom}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="input py-1"
                      value={u.role.libelle}
                      onChange={(e) => onUpdateRole(u.id, e.target.value as Role)}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="COACH">COACH</option>
                      <option value="CLIENT">CLIENT</option>
                    </select>
                  </td>
                  <td className="text-right">
                    <button className="btn-danger" onClick={() => onDeleteUser(u.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {seances.map((s) => (
            <div key={s.id} className="card flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{s.titre}</h2>
                <p className="text-sm text-slate-600">{formatDateTime(s.dateDebut)} → {formatDateTime(s.dateFin)}</p>
                <p className="text-sm text-slate-500">
                  Coach : {s.coach.utilisateur.prenom} {s.coach.utilisateur.nom} · {s.placesPrises}/{s.capaciteMax} places
                </p>
              </div>
              <button className="btn-danger" onClick={() => onDeleteSeance(s.id)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
