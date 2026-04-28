import { FormEvent, useEffect, useState } from 'react';
import { seancesApi } from '../api/seances';
import type { Seance, Reservation } from '../types';
import Alert from '../components/Alert';
import { formatDateTime, toDatetimeLocal } from '../utils/dates';

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
  titre: '', description: '', categorie: '', dateDebut: '', dateFin: '', capaciteMax: 10, lieu: '',
};

export default function CoachPage() {
  const [seances, setSeances] = useState<Seance[]>([]);
  const [participants, setParticipants] = useState<Record<number, Reservation[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try { setSeances(await seancesApi.listMine()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      capaciteMax: Number(form.capaciteMax),
      dateDebut: new Date(form.dateDebut).toISOString(),
      dateFin: new Date(form.dateFin).toISOString(),
      categorie: form.categorie || undefined,
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

  const onDelete = async (id: number) => {
    if (!confirm('Supprimer cette seance ?')) return;
    try { await seancesApi.remove(id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
  };

  const toggleParticipants = async (id: number) => {
    if (participants[id]) {
      setParticipants((p) => { const { [id]: _, ...rest } = p; return rest; });
      return;
    }
    try {
      const list = await seancesApi.participants(id);
      setParticipants((p) => ({ ...p, [id]: list }));
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
  };

  const upcoming = seances.filter((s) => new Date(s.dateDebut) > new Date());
  const past = seances.filter((s) => new Date(s.dateDebut) <= new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Mon planning</h1>
          <p className="page-subtitle">{seances.length} seance{seances.length > 1 ? 's' : ''} au total</p>
        </div>
        <button className="btn-primary" onClick={showForm && !editingId ? closeForm : openCreate}>
          {showForm && !editingId ? '✕ Annuler' : '+ Nouvelle seance'}
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {info  && <Alert type="success">{info}</Alert>}

      {/* Formulaire creation / edition */}
      {showForm && (
        <div className="card border-brand-200 dark:border-brand-800 animate-slide-up">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">
              {editingId ? '✏️ Modifier la seance' : '+ Nouvelle seance'}
            </h2>
            <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onClick={closeForm}>✕</button>
          </div>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Titre</label>
              <input className="input" required placeholder="Ex: Yoga du matin" value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            </div>

            {/* Categorie — grille visuelle */}
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
              {form.categorie && (
                <p className="mt-2 text-xs text-brand-600 dark:text-brand-400">
                  {CATEGORY_EMOJI[form.categorie]} {form.categorie} selectionne
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} placeholder="Description de la seance..." value={form.description}
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

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="h-7 w-7 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : seances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-14 dark:border-dark-600">
          <span className="text-5xl">📅</span>
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">Aucune seance planifiee</p>
          <p className="text-sm text-slate-500">Cliquez sur "+ Nouvelle seance" pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="section-title mb-3">A venir ({upcoming.length})</h2>
              <div className="space-y-3">
                {upcoming.map((s) => (
                  <SeanceCard key={s.id} seance={s} participants={participants}
                    onEdit={openEdit} onDelete={onDelete} onToggle={toggleParticipants}
                    isEditing={editingId === s.id} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="section-title mb-3 text-slate-500">Passees ({past.length})</h2>
              <div className="space-y-3 opacity-70">
                {past.map((s) => (
                  <SeanceCard key={s.id} seance={s} participants={participants}
                    onEdit={openEdit} onDelete={onDelete} onToggle={toggleParticipants}
                    isEditing={editingId === s.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeanceCard({ seance: s, participants, onEdit, onDelete, onToggle, isEditing }: {
  seance: Seance;
  participants: Record<number, Reservation[]>;
  onEdit: (s: Seance) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  isEditing: boolean;
}) {
  const emoji = s.categorie ? (CATEGORY_EMOJI[s.categorie] ?? '🏅') : '🏅';
  const full = s.placesPrises >= s.capaciteMax;

  return (
    <div className={'card transition-all ' + (isEditing ? 'ring-2 ring-brand-500' : '')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="sport-icon text-xl">{emoji}</div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-white">{s.titre}</h2>
              {s.categorie && <span className="badge-primary">{s.categorie}</span>}
              {full && <span className="badge-danger">Complet</span>}
              {isEditing && <span className="badge-warning">En cours de modification</span>}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatDateTime(s.dateDebut)} → {formatDateTime(s.dateFin)}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>👥 {s.placesPrises}/{s.capaciteMax} participants</span>
              {s.lieu && <span>📍 {s.lieu}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => onToggle(s.id)}>
            {participants[s.id] ? 'Masquer' : 'Participants'}
          </button>
          <button className="btn-secondary" onClick={() => onEdit(s)}>✏️ Modifier</button>
          <button className="btn-danger" onClick={() => onDelete(s.id)}>Supprimer</button>
        </div>
      </div>

      {/* Barre de remplissage */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-dark-600">
        <div
          className={'h-full rounded-full ' + (full ? 'bg-red-500' : s.placesPrises / s.capaciteMax > 0.75 ? 'bg-amber-500' : 'bg-emerald-500')}
          style={{ width: `${Math.min(100, (s.placesPrises / s.capaciteMax) * 100)}%` }}
        />
      </div>

      {participants[s.id] && (
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-dark-600">
          <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Participants confirmes ({participants[s.id].length})
          </h3>
          {participants[s.id].length === 0 ? (
            <p className="text-sm text-slate-500">Aucun participant pour le moment.</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {participants[s.id].map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-dark-700">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {r.client?.prenom?.[0]}{r.client?.nom?.[0]}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {r.client?.prenom} {r.client?.nom}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
