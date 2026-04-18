[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=22617955)

# EMR-PA Setup Guide

This guide covers the steps needed to set up and run the project locally.

## Project URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Postgres: `localhost:5432`

## What You Need

Install these before you start:

- Node.js
- npm
- Git
- Docker Desktop

Keep Docker Desktop open while using the local database.

## 1. Get the Project

If you do not already have the repo:

```bash
git clone https://github.com/jeannamatthews-classes/group-project-emr-pa.git
cd group-project-emr-pa
```

If you already made a local repo and need to connect it:

```bash
git remote add origin https://github.com/jeannamatthews-classes/group-project-emr-pa.git
git pull origin main
git checkout main
```

Install project dependencies from the root folder:

```bash
npm install
```

## 2. Start the Database

From the root folder, run:

```bash
npm run db:up
```

Useful database commands:

- `npm run db:up` starts Postgres
- `npm run db:down` stops Postgres
- `npm run db:reset` stops Postgres and clears local database data

## 3. Create the Backend Environment File

In `apps/backend`, create a file named `.env`.

Copy the values from `apps/backend/.env.template`.

Default local values:

```env
PORT=5001
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/emrpa?schema=public"
```

Notes:

- Use `5001` for the backend unless you have a reason to change it.
- Do not commit `.env` to Git.
- If you change the frontend port, update `CORS_ORIGIN`.

## 4. Set Up Prisma

From `apps/backend`, run:

```bash
npx prisma generate
npm run prisma:migrate
```

What these do:

- `npx prisma generate` builds the prisma client
- `npm run prisma:migrate` applies database migrations to your local database

Run them again any time the prisma schema or migrations change.

## 5. Start the App

Open two terminals from the project root.

In the first terminal:

```bash
npm run dev:frontend
```

In the second terminal:

```bash
npm run dev:backend
```

Keep both running while you work.

## 6. Quick Checks

Use these links to confirm everything is working:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5001/health`
- Database test: `http://localhost:5001/api/db-test`

## Prisma Tools

If you want to see the database in prisma Studio, run this from `apps/backend`:

```bash
npm run prisma:studio
```

If you are creating a new schema change, use:

```bash
npx prisma migrate dev --name your-change-name
```

Then run:

```bash
npx prisma generate
```

## Summary of Setup Commands

For first-time local setup:

```bash
npm install
npm run db:up
cd apps/backend
npx prisma generate
npm run prisma:migrate
cd ../..
npm run dev:frontend
open a new terminal
npm run dev:backend
```