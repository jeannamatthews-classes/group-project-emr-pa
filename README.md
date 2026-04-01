[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=22617955)

# EMR-PA Project Setup
Frontend: http://localhost:5173<br>
Backend:  http://localhost:5000<br>
Postgres: localhost:5432<br>

## Prereqs
- Node.js, npm, git, docker desktop
- Docker Desktop should be open before running DB commands

## Connect to local repo
Assuming you have already run git init locally:<br>
- git remote add origin https://github.com/jeannamatthews-classes/group-project-emr-pa.git<br>
- git pull origin main
- git checkout main
- npm install

### start up project
- npm run db:up (starts Postgres container)
    - When to do this: at the start of each dev session if DB is not already running
    - Other DB scripts: npm run db:down, npm run db:reset

- Create a .env file in apps/backend and copy values from .env.template
    - When to do this: first-time setup only (or whenever env values change)
    - .env should never be pushed to github, always push template only

- navigate to apps/backend
- run npx prisma generate
    - When to do this: first setup and after schema changes
- run npm run prisma:migrate
    - When to do this: first setup and whenever new migrations exist

- go back to root (../..)
- run npm run dev:frontend to start frontend
- in a second terminal (from root), run npm run dev:backend to start backend
    - Keep both terminals running while developing


## Start up prisma
- Make sure you have run npm run db:up
- Navigate to apps/backend and run npx prisma migrate dev --name init
    - When to do this: first migration on a fresh local DB, or when creating a new schema migration
- Then run npx prisma generate
- Then run npm run prisma:studio (opens Prisma Studio for viewing DB)
- Quick checks:
    - Backend health: http://localhost:5000/health
    - DB connection test: http://localhost:5000/api/db-test

### Optional (create a table, migrate and add some info) only for Database team
- First make sure prisma extension is installed in vscode (optional but helpful)
- Open schema.prisma in prisma folder
- create a table eg<br> 
model firstTable {<br>
  id    Int    @id @default(autoincrement())<br>
  email String @unique<br>
  name  String?<br>
}<br>
- run npm run prisma:migrate or npx prisma migrate dev --name any-comment-you-want
- run npm run prisma:studio again 
- you should see a table below _prisma_migrations in which you can add new entries etc.
- check migrations folder, should see SQL code and a migration toml file, commit the folder
- Learn some prisma before writing raw sql directly (raw sql can be useful but easier to misuse)
