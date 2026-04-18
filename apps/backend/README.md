# Backend Spin-Up

Use the root `README.md` for full project setup.

Follow these steps in order.

## 1. Install Dependencies

From the project root:

```bash
npm install
```

## 2. Start the Database

Make sure Docker Desktop is open.

From the project root:

```bash
npm run db:up
```

## 3. Create the Environment File

In `apps/backend`, make sure you have a `.env` file.

If you do not have one yet, copy the values from `apps/backend/.env.template`.

## 4. Run Prisma Setup

From `apps/backend`:

```bash
npx prisma generate
npm run prisma:migrate
```

## 5. Start the Backend

Go back to the project root and run:

```bash
npm run dev:backend
```

Backend URL:

```text
http://localhost:5001
```

## 6. Check That It Works

Open these in your browser:

- Health check: `http://localhost:5001/health`
- Database test: `http://localhost:5001/api/db-test`

If both pages load correctly, the backend is ready.
