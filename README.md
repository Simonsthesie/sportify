# Sportify Pro

Application web complète de gestion de séances de coaching sportif - examen CDA 2ème année.

> Sujet : `Sujet CDA 2ème année 2026.pdf`

## Sommaire

1. [Description](#description)
2. [Stack technique](#stack-technique)
3. [Architecture](#architecture)
4. [Démarrage rapide (Docker)](#démarrage-rapide-docker)
5. [Démarrage en mode dev](#démarrage-en-mode-dev-sans-docker)
6. [Comptes de démonstration](#comptes-de-démonstration)
7. [Endpoints principaux](#endpoints-principaux)
8. [Tests](#tests)
9. [Structure du projet](#structure-du-projet)
10. [Choix techniques](#choix-techniques)
11. [Livrables](#livrables)

---

## Description

Sportify Pro permet :

- **aux clients** de créer un compte, consulter les séances disponibles, réserver et annuler ;
- **aux coachs** de gérer leur planning et de voir les participants ;
- **à l'administrateur** de piloter l'activité (utilisateurs, séances).

Règles de gestion appliquées (voir `docs/02_MCD.md`) :

- nombre maximum de participants par séance,
- pas de double réservation sur le même créneau (chevauchement détecté),
- réservation impossible si la séance est complète ou déjà commencée,
- authentification obligatoire via JWT,
- contrôle d'accès basé sur le rôle (RBAC).

## Stack technique

| Couche       | Techno                                                             |
|--------------|--------------------------------------------------------------------|
| Base         | MySQL 8 (conteneur) + phpMyAdmin                                   |
| Backend      | Node.js 20 + Express 4 + TypeScript + Prisma 5 + Zod               |
| Auth         | JWT (jsonwebtoken) + bcryptjs                                      |
| Doc API      | Swagger (swagger-jsdoc + swagger-ui-express)                       |
| Tests        | Jest + ts-jest                                                     |
| Frontend     | React 18 + Vite 5 + TypeScript + Tailwind CSS + React Router 6     |
| Conteneurs   | Docker + docker-compose (4 services)                               |

## Architecture

Architecture **3-tiers** (présentation / logique métier / données). Voir `docs/06_architecture.md`.

```
[ React (Vite) ]  --HTTPS/JSON-->  [ API Express (TS + Prisma) ]  --SQL-->  [ MySQL 8 ]
                                          |
                                          +--->  Swagger /api/docs
                                          |
                                  phpMyAdmin (admin BDD) -----------> MySQL 8
```

## Démarrage rapide (Docker)

> Prérequis : Docker Desktop installé et lancé.

```bash
git clone https://github.com/Simonsthesie/sportify.git
cd sportify
cp .env.example .env

docker compose up -d --build
```

Une fois lancé :

| Service        | URL                            |
|----------------|--------------------------------|
| Frontend       | http://localhost:5173          |
| API REST       | http://localhost:4000/api      |
| Swagger        | http://localhost:4000/api/docs |
| Healthcheck    | http://localhost:4000/health   |
| phpMyAdmin     | http://localhost:8080          |
| MySQL          | localhost:3306                 |

> Les migrations Prisma sont exécutées automatiquement au démarrage du backend (`npx prisma migrate deploy`). Pour charger les comptes de démo, lancez le seed :
>
> ```bash
> docker compose exec backend npm run prisma:seed
> ```

Pour tout arrêter :

```bash
docker compose down       # garde le volume MySQL
docker compose down -v    # supprime aussi les données
```

## Démarrage en mode dev (sans Docker)

> Vous pouvez lancer uniquement la BDD via Docker et le reste en local :

```bash
docker compose up -d mysql phpmyadmin
```

### Backend

```bash
cd backend
npm install
cp ../.env.example .env
# Editer DATABASE_URL pour pointer vers localhost:3306 au lieu de mysql:3306

npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

npm run dev
```

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:4000/api" > .env
npm run dev
```

## Comptes de démonstration

Mot de passe pour tous les comptes : **`Password123!`**

| Email                    | Rôle   |
|--------------------------|--------|
| admin@sportify.test      | ADMIN  |
| coach1@sportify.test     | COACH  |
| coach2@sportify.test     | COACH  |
| client1@sportify.test    | CLIENT |
| client2@sportify.test    | CLIENT |

## Endpoints principaux

Toutes les routes sont préfixées par `/api`. Documentation interactive : http://localhost:4000/api/docs

### Auth (publique)

| Méthode | Route             | Description              |
|---------|-------------------|--------------------------|
| POST    | `/auth/register`  | Inscription (CLIENT)     |
| POST    | `/auth/login`     | Connexion (renvoie JWT)  |
| GET     | `/auth/me`        | Payload du token courant |

### Utilisateurs (ADMIN)

| Méthode | Route                | Description                       |
|---------|----------------------|-----------------------------------|
| GET     | `/users`             | Liste des utilisateurs            |
| GET     | `/users/:id`         | Détail                            |
| PATCH   | `/users/:id/role`    | Modifier le rôle                  |
| DELETE  | `/users/:id`         | Supprimer                         |

### Séances

| Méthode | Route                          | Rôles requis      |
|---------|--------------------------------|-------------------|
| GET     | `/seances`                     | Tout connecté     |
| GET     | `/seances/me`                  | COACH             |
| GET     | `/seances/:id`                 | Tout connecté     |
| POST    | `/seances`                     | COACH, ADMIN      |
| PATCH   | `/seances/:id`                 | COACH (le sien) ou ADMIN |
| DELETE  | `/seances/:id`                 | COACH (le sien) ou ADMIN |
| GET     | `/seances/:id/participants`    | COACH, ADMIN      |

### Réservations

| Méthode | Route                                     | Rôles requis          |
|---------|-------------------------------------------|-----------------------|
| GET     | `/reservations/me`                        | tout connecté         |
| GET     | `/reservations`                           | ADMIN                 |
| POST    | `/reservations`                           | CLIENT                |
| PATCH   | `/reservations/:id/cancel`               | propriétaire ou ADMIN |
| POST    | `/reservations/attente`                   | CLIENT                |
| DELETE  | `/reservations/attente/:seanceId`         | CLIENT                |
| GET     | `/reservations/attente/:seanceId/position`| CLIENT                |

### Avis

| Méthode | Route                   | Rôles requis |
|---------|-------------------------|--------------|
| POST    | `/avis`                 | CLIENT       |
| GET     | `/avis/seance/:seanceId`| tout connecté|

### Notifications

| Méthode | Route                        | Rôles requis  |
|---------|------------------------------|---------------|
| GET     | `/notifications`             | tout connecté |
| GET     | `/notifications/unread-count`| tout connecté |
| PATCH   | `/notifications/:id/read`    | propriétaire  |
| PATCH   | `/notifications/read-all`    | tout connecté |

### Coaches

| Méthode | Route      | Rôles requis  |
|---------|------------|---------------|
| GET     | `/coaches` | tout connecté |

### Profil utilisateur

| Méthode | Route              | Rôles requis  |
|---------|--------------------|---------------|
| GET     | `/users/me`        | tout connecté |
| PATCH   | `/users/me`        | tout connecté |
| PATCH   | `/users/me/password`| tout connecté|

## Tests

Tests unitaires et d'intégration Jest sur le backend (utilitaires JWT/password, middleware d'auth, validators Zod, routes d'intégration).

```bash
cd backend
npm test
```

```
Test Suites: 7 passed, 7 total
Tests:       15 passed, 15 total
```

## Structure du projet

```
sportify/
├── backend/                  # API Node.js + Express + TS
│   ├── prisma/
│   │   ├── schema.prisma     # Modèle de données Prisma
│   │   ├── seed.ts           # Données de démonstration
│   │   └── migrations/       # Migrations SQL versionnées
│   ├── src/
│   │   ├── config/           # env vars, prisma client, swagger
│   │   ├── middlewares/      # auth (JWT), roles (RBAC), validate, errorHandler
│   │   ├── modules/
│   │   │   ├── auth/         # inscription, connexion, JWT
│   │   │   ├── users/        # gestion utilisateurs + profil (/me)
│   │   │   ├── coaches/      # liste des coachs
│   │   │   ├── seances/      # CRUD séances + participants
│   │   │   ├── reservations/ # réservations + annulation + liste d'attente
│   │   │   ├── avis/         # notes et commentaires sur les séances
│   │   │   └── notifications/# notifications in-app
│   │   ├── utils/            # helpers (jwt, password, errors)
│   │   ├── app.ts            # création de l'app Express + routes globales
│   │   └── server.ts         # bootstrap (listen)
│   ├── tests/                # Jest (utils, middlewares, validators, integration)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # SPA React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/              # client HTTP (auth, seances, reservations, users, avis, notifications)
│   │   ├── components/       # Navbar, Alert, ProtectedRoute, NotificationsDropdown
│   │   ├── context/          # AuthContext, ThemeContext (dark mode)
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx / RegisterPage.tsx
│   │   │   ├── SeancesPage.tsx      # liste + filtres + réservation
│   │   │   ├── MesReservationsPage.tsx  # historique + avis
│   │   │   ├── CalendarPage.tsx     # calendrier interactif (react-big-calendar)
│   │   │   ├── ProfilPage.tsx       # édition profil + stats
│   │   │   ├── CoachPage.tsx        # planning + création/modification séances
│   │   │   └── AdminPage.tsx        # gestion utilisateurs + toutes séances
│   │   ├── types.ts          # interfaces TypeScript métier
│   │   ├── utils/dates.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── db/init/                  # Schéma SQL initial + données de seed
│   ├── 01_schema.sql
│   └── 02_seed.sql
│
├── docs/                     # Conception (livrables CDA)
│   ├── 01_cas_utilisation.md
│   ├── 02_MCD.md
│   ├── 03_MLD.md
│   ├── 04_diagramme_classes.md
│   ├── 05_user_stories.md
│   ├── 06_architecture.md
│   └── 07_wireframes.md
│
├── .github/workflows/ci.yml  # CI/CD GitHub Actions (lint + tests + build)
├── docker-compose.yml        # mysql + phpmyadmin + backend + frontend
├── .env.example
└── README.md
```

## Choix techniques

| Décision                         | Justification                                                                                       |
|----------------------------------|-----------------------------------------------------------------------------------------------------|
| **Node.js + Express + TS**       | Stack légère, productive, typage statique, écosystème mature.                                       |
| **Prisma**                       | ORM type-safe, migrations versionnées, modélisation claire dans `schema.prisma`.                    |
| **MySQL**                        | Demandé implicitement (phpMyAdmin), SGBD relationnel éprouvé.                                       |
| **JWT stateless**                | Aucun stockage côté serveur, scalabilité horizontale, simple à propager.                            |
| **Zod**                          | Validation déclarative côté API + dérivation des types TypeScript.                                  |
| **Architecture en couches**      | `routes -> controller -> service -> orm` : séparation des responsabilités, testabilité.             |
| **React + Vite + Tailwind**      | Hot reload, build rapide, UI moderne sans CSS custom lourd.                                         |
| **React Context (Auth + Theme)** | Volume d'état limité, dark mode persisté en localStorage, pas besoin de Redux.                      |
| **Docker multi-stage**           | Images de production allégées (backend `dist/`, frontend `nginx`).                                  |
| **Swagger via JSDoc**            | Documentation co-localisée avec le code, toujours à jour.                                           |
| **bcrypt 10 rounds**             | Bon compromis sécurité / performance.                                                               |
| **Helmet + CORS restreint**      | Headers de sécurité par défaut, origine du frontend whitelistée uniquement.                         |
| **GitHub Actions CI/CD**         | Lint + tests + build Docker automatisés à chaque push sur `main`.                                   |

## Livrables

| Demandé                     | Emplacement                                |
|-----------------------------|--------------------------------------------|
| Code source structuré       | `backend/`, `frontend/`                    |
| Historique Git              | https://github.com/Simonsthesie/sportify   |
| Diagramme cas d'utilisation | `docs/01_cas_utilisation.md`               |
| MCD / MLD / classes UML     | `docs/02_MCD.md`, `03_MLD.md`, `04_*.md`   |
| User stories                | `docs/05_user_stories.md`                  |
| Architecture 3-tiers        | `docs/06_architecture.md`                  |
| Wireframes                  | `docs/07_wireframes.md`                    |
| Script SQL                  | `db/init/01_schema.sql`, `02_seed.sql`     |
| Schéma Prisma               | `backend/prisma/schema.prisma`             |
| Documentation API           | Swagger sur `/api/docs`                    |
| Tests unitaires             | `backend/tests/` (7 suites, 15 tests)      |
| CI/CD                       | `.github/workflows/ci.yml`                 |
| Dockerfile / docker-compose | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` |
| README                      | Ce fichier                                 |

---

**Auteur** : Simon  
**Examen** : Concepteur Développeur d'Applications - 2ème année - Foreach Academy  
**Date** : Avril 2026
