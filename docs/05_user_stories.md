# User Stories - Sportify Pro

Format : *En tant que... je veux... afin de...*

## Authentification (commun)

- **US-AUTH-01** : En tant que visiteur, je veux créer un compte client (email, mot de passe, nom, prénom) afin de pouvoir réserver des séances.
- **US-AUTH-02** : En tant qu'utilisateur, je veux me connecter avec mon email et mon mot de passe afin d'accéder à mon espace.
- **US-AUTH-03** : En tant qu'utilisateur connecté, je veux que ma session soit sécurisée (JWT) afin d'éviter qu'un tiers usurpe mon identité.

## Client

- **US-CLI-01** : En tant que client, je veux consulter la liste des séances disponibles afin de choisir laquelle réserver.
- **US-CLI-02** : En tant que client, je veux filtrer les séances par date / coach / lieu afin de trouver rapidement ce qui m'intéresse.
- **US-CLI-03** : En tant que client, je veux réserver une séance afin d'y participer.
- **US-CLI-04** : En tant que client, je veux être empêché de réserver deux séances qui se chevauchent afin d'éviter les conflits.
- **US-CLI-05** : En tant que client, je veux voir la liste de mes réservations afin de suivre mes séances à venir.
- **US-CLI-06** : En tant que client, je veux annuler une réservation afin de libérer ma place.

## Coach

- **US-COA-01** : En tant que coach, je veux consulter mon planning afin de voir mes prochaines séances.
- **US-COA-02** : En tant que coach, je veux créer une séance (titre, date, durée, capacité) afin de proposer un nouveau cours.
- **US-COA-03** : En tant que coach, je veux modifier ou supprimer une de mes séances afin de gérer mon planning.
- **US-COA-04** : En tant que coach, je veux voir les participants inscrits à une séance afin de préparer le cours.

## Administrateur

- **US-ADM-01** : En tant qu'administrateur, je veux consulter et gérer les utilisateurs (lister, modifier le rôle, supprimer) afin de piloter la plateforme.
- **US-ADM-02** : En tant qu'administrateur, je veux superviser toutes les séances (toutes les coachs confondus) afin de surveiller l'activité.
- **US-ADM-03** : En tant qu'administrateur, je peux modifier ou supprimer n'importe quelle séance afin d'assurer la modération.

## Critères d'acceptation transverses

- L'API rejette toute requête non authentifiée (sauf `/auth/register`, `/auth/login`).
- L'API valide les entrées (email, dates, capacité, etc.) avec un message d'erreur clair.
- Toutes les réponses sont au format JSON.
