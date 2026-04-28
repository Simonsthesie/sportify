import { FormEvent, useEffect, useState } from 'react';
import { usersApi, type AdminUser } from '../api/users';
import { seancesApi, coachesApi, type CoachInfo } from '../api/seances';
import type { Seance, Role } from '../types';
import Alert from '../components/Alert';
import { formatDateTime, toDatetimeLocal } from '../utils/dates';

type Tab = 'users' | 'seances';

const CATEGORIES = [
  'Musculation', 'Cardio', 'Yoga', 'Pilates', 'Boxe',
  'Natation', 'Cyclisme', 'Football', 'Basketball', 'Running',
  'CrossFit', 'Arts martiaux', 'Stretching', 'Autre',
];

const CATEGORY_EMOJI: Record<string, string> = {
  Musculation: '🏋️', Cardio: '🏃', Yoga: '🧘', Pilates: '🤸',
  Boxe: '🥊', Natation: '🏊', Cyclisme: '🚴', Football: '⚽',
  Basketball: '🏀', Running: '👟', CrossFit: '💪', 'Arts martiaux': '🥋',
  Stretching: '🙆', Autre: '🏅',
};

const emptyForm = {
  titre: '', description: '', categorie: '', dateDebut: '', dateFin: '',
  capaciteMax: 10, lieu: '', coachId: '',
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [coaches, setCoaches] = useState<CoachInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Formulaire seance
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, sr, c] = await Promise.all([
        usersApi.list(),
        seancesApi.list({ limit: 200 }),
        coachesApi.list(),
      ]);
      setUsers(u);
      setSeances(sr.data);
      setCoaches(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* ---- Users ---- */
  const onUpdateRole = async (id: number, role: Role) => {
    try { await usersApi.updateRole(id, role); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
  };

  const onDeleteUser = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try { await usersApi.remove(id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
  };

  /* ---- Seances form ---- */
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
    setInfo(null);
  };

  const openEdit = (s: Seance) => {
    setEditingId(s.id);
    setForm({
      titre: s.titre,
      description: s.description ?? '',
      categorie: s.categorie ?? '',
      dateDebut: toDatetimeLocal(s.dateDebut),
      dateFin: toDatetimeLocal(s.dateFin),
      capaciteMax: s.capaciteMax,
      lieu: s.lieu ?? '',
      coachId: String(s.coach.id),
    });
    setShowForm(true);
    setError(null);
    setInfo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const onSubmitSeance = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      titre: form.titre,
      description: form.description || undefined,
      categorie: form.categorie || undefined,
      dateDebut: new Date(form.dateDebut).toISOString(),
      dateFin: new Date(form.dateFin).toISOString(),
      capaciteMax: Number(form.capaciteMax),
      lieu: form.lieu || undefined,
      coachId: form.coachId ? Number(form.coachId) : undefined,
    };
    try {
      if (editingId !== null) {
        await seancesApi.update(editingId, payload);
        setInfo('Seance mise a jour !');
      } else {
        await seancesApi.create(payload);
        setInfo('Seance creee !');
      }
      closeForm();
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
  };

  const onDeleteSeance = async (id: number) => {
    if (!confirm('Supprimer cette seance ?')) return;
    try { await seancesApi.remove(id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Administration</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-dark-700">
        <button
          className={'flex-1 rounded-lg py-2 text-sm font-semibold transition-all ' +
            (tab === 'users' ? 'bg-white text-brand-700 shadow dark:bg-dark-600 dark:text-brand-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}
          onClick={() => setTab('users')}>
          👤 Utilisateurs ({users.length})
        </button>
        <button
          className={'flex-1 rounded-lg py-2 text-sm font-semibold transition-all ' +
            (tab === 'seances' ? 'bg-white text-brand-700 shadow dark:bg-dark-600 dark:text-brand-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}
          onClick={() => setTab('seances')}>
          📅 Seances ({seances.length})
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {info  && <Alert type="success">{info}</Alert>}

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="h-7 w-7 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : tab === 'users' ? (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="pb-3">ID</th>
                <th className="pb-3">Nom</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-dark-700/50">
                  <td className="py-2 text-slate-400">#{u.id}</td>
                  <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{u.prenom} {u.nom}</td>
                  <td className="py-2 text-slate-500">{u.email}</td>
                  <td className="py-2">
                    <select
                      className="input py-1 text-xs"
                      value={u.role.libelle}
                      onChange={(e) => onUpdateRole(u.id, e.target.value as Role)}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="COACH">COACH</option>
                      <option value="CLIENT">CLIENT</option>
                    </select>
                  </td>
                  <td className="py-2 text-right">
                    <button className="btn-danger" onClick={() => onDeleteUser(u.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header seances + bouton creer */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">{seances.length} seance{seances.length > 1 ? 's' : ''}</p>
            <button className="btn-primary" onClick={showForm && !editingId ? closeForm : openCreate}>
              {showForm && !editingId ? '✕ Annuler' : '+ Nouvelle seance'}
            </button>
          </div>

          {/* Formulaire creation / edition */}
          {showForm && (
            <div className="card border-brand-200 dark:border-brand-800 animate-slide-up">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-title">
                  {editingId ? '✏️ Modifier la seance' : '+ Nouvelle seance'}
                </h2>
                <button type="button" className="text-slate-400 hover:text-slate-600" onClick={closeForm}>✕</button>
              </div>
              <form onSubmit={onSubmitSeance} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Titre</label>
                  <input className="input" required placeholder="Ex: Yoga matinal" value={form.titre}
                    onChange={(e) => setForm({ ...form, titre: e.target.value })} />
                </div>
                <div>
                  <label className="label">Coach</label>
                  <select className="input" required={!editingId} value={form.coachId}
                    onChange={(e) => setForm({ ...form, coachId: e.target.value })}>
                    <option value="">-- Selectionner un coach --</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.utilisateur.prenom} {c.utilisateur.nom} — {c.specialite}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categorie */}
                <div className="md:col-span-2">
                  <label className="label">Categorie de sport</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({ ...form, categorie: form.categorie === cat ? '' : cat })}
                        className={
                          'flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-xs font-semibold transition-all ' +
                          (form.categorie === cat
                            ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sport dark:bg-brand-900/30 dark:text-brand-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-dark-600 dark:bg-dark-700 dark:text-slate-300 dark:hover:border-brand-500')
                        }
                      >
                        <span className="text-xl">{CATEGORY_EMOJI[cat]}</span>
                        <span className="text-center leading-tight">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input" rows={2} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="label">Debut</label>
                  <input className="input" type="datetime-local" required value={form.dateDebut}
                    onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
                </div>
                <div>
                  <label className="label">Fin</label>
                  <input className="input" type="datetime-local" required value={form.dateFin}
                    onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
                </div>
                <div>
                  <label className="label">Capacite max</label>
                  <input className="input" type="number" min={1} required value={form.capaciteMax}
                    onChange={(e) => setForm({ ...form, capaciteMax: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Lieu</label>
                  <input className="input" placeholder="Salle 1, Box A..." value={form.lieu}
                    onChange={(e) => setForm({ ...form, lieu: e.target.value })} />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="btn-primary flex-1">
                    {editingId ? 'Enregistrer les modifications' : 'Creer la seance'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={closeForm}>Annuler</button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des seances */}
          {seances.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-10 dark:border-dark-600">
              <span className="text-4xl">📅</span>
              <p className="mt-2 text-slate-500">Aucune seance</p>
            </div>
          ) : (
            <div className="space-y-2">
              {seances.map((s) => {
                const emoji = s.categorie ? (CATEGORY_EMOJI[s.categorie] ?? '🏅') : '🏅';
                const isEditing = editingId === s.id;
                return (
                  <div key={s.id} className={'card flex flex-wrap items-start justify-between gap-3 ' + (isEditing ? 'ring-2 ring-brand-500' : '')}>
                    <div className="flex items-start gap-3">
                      <div className="sport-icon">{emoji}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-slate-900 dark:text-white">{s.titre}</h2>
                          {s.categorie && <span className="badge-primary">{s.categorie}</span>}
                          {isEditing && <span className="badge-warning">En modification</span>}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDateTime(s.dateDebut)} → {formatDateTime(s.dateFin)}
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-slate-400">
                          <span>👤 {s.coach.utilisateur.prenom} {s.coach.utilisateur.nom} ({s.coach.specialite})</span>
                          <span>👥 {s.placesPrises}/{s.capaciteMax}</span>
                          {s.lieu && <span>📍 {s.lieu}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => openEdit(s)}>✏️ Modifier</button>
                      <button className="btn-danger" onClick={() => onDeleteSeance(s.id)}>Supprimer</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
