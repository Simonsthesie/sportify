# Sportify Pro - Backend

API REST en Node.js + Express + TypeScript, avec Prisma ORM (MySQL) et authentification JWT.

## Prerequis

- Node.js 20+
- MySQL 8 (ou Docker via le `docker-compose.yml` a la racine)

## Installation locale

```bash
cd backend
npm install
cp ../.env.example .env
# Adaptez DATABASE_URL si besoin (ex: localhost au lieu de mysql)

npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

npm run dev
```

Serveur sur http://localhost:4000

- Swagger : http://localhost:4000/api/docs
- Health  : http://localhost:4000/health

## Comptes par defaut (apres seed)

Mot de passe pour tous : `Password123!`

| Email                     | Role   |
|---------------------------|--------|
| admin@sportify.test       | ADMIN  |
| coach1@sportify.test      | COACH  |
| coach2@sportify.test      | COACH  |
| client1@sportify.test     | CLIENT |
| client2@sportify.test     | CLIENT |

## Tests

```bash
npm test
```

Les tests unitaires (Jest) couvrent les utilitaires, les middlewares et les validators.

## Scripts utiles

| Commande                    | Effet                                       |
|-----------------------------|---------------------------------------------|
| `npm run dev`               | Demarre en mode dev (hot-reload)            |
| `npm run build`             | Compile TS -> JS                            |
| `npm start`                 | Demarre la version compilee                 |
| `npm run prisma:migrate`    | Cree une migration                          |
| `npm run prisma:seed`       | Charge les donnees de demo                  |
| `npm test`                  | Lance les tests Jest                        |
