# MLD - Modèle Logique de Données - Sportify Pro

Notation : cle_primaire, #cle_etrangere, attribut

```
role          (id, libelle)

utilisateur   (id, email, mot_de_passe, nom, prenom,
               #role_id -> role(id),
               cree_le, maj_le)

coach         (id, #utilisateur_id -> utilisateur(id) UNIQUE,
               specialite, bio)

seance        (id, titre, description, categorie, date_debut, date_fin,
               capacite_max, lieu,
               #coach_id -> coach(id),
               cree_le, maj_le)

reservation   (id,
               #client_id -> utilisateur(id),
               #seance_id -> seance(id),
               statut, cree_le, maj_le,
               UNIQUE(client_id, seance_id))

liste_attente (id,
               #client_id -> utilisateur(id),
               #seance_id -> seance(id),
               position,
               cree_le,
               UNIQUE(client_id, seance_id))

avis          (id,
               #client_id -> utilisateur(id),
               #seance_id -> seance(id),
               note, commentaire, cree_le,
               UNIQUE(client_id, seance_id))

notification  (id,
               #user_id -> utilisateur(id),
               message, lu, cree_le)
```

## Contraintes

- **Clés étrangères** : ON DELETE CASCADE pour reservations, liste_attente, avis, notifications (cohérence lors de la suppression d'un utilisateur ou d'une séance).
- **CHECK** : `capacite_max > 0`, `date_fin > date_debut`, `statut IN ('CONFIRMEE','ANNULEE')`, `note BETWEEN 1 AND 5`.
- **UNIQUE** : `email` (utilisateur), `(client_id, seance_id)` (reservation, liste_attente, avis), `utilisateur_id` (coach).
- **Index** : email, role_id, dates de séance, FK des réservations et liste d'attente (recherches fréquentes), `(user_id, lu)` pour les notifications non lues.

## Choix techniques

- Héritage `utilisateur` → `coach` modélisé par une relation 1-1 (table coach distincte) :
  permet d'ajouter des attributs spécifiques au coach sans polluer la table utilisateur.
- Le statut `ANNULEE` conserve l'historique des réservations sans perte d'information.
- La table `liste_attente` utilise un champ `position` pour garantir l'ordre de priorité ; lors d'une annulation, le premier de la liste est promu automatiquement en réservation CONFIRMEE et reçoit une notification.
- La table `avis` est contrainte à un avis unique par (client, séance) pour éviter les doublons.
- Toutes les FK sont indexées pour optimiser les jointures sur les pages liste/planning.
