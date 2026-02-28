[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=22617955)



# EMR-PA Project Setup
How to get started<br>
Frontend: http://localhost:5173<br>
Backend:  http://localhost:5000<br>
Postgres: localhost:5432<br>

## Prereqs
- Node.js, git, docker desktop

## Connect to local repo
Asumming you have already ran "git init"<br>
- git remote add origin https://github.com/jeannamatthews classes/group-project-emr-pa.git<br>
- git pull
- git checkout main
- npm install

### To make sure everything is Good
- npm run db:up (start db, docker needs to be opened for this to work)
- npm run db:down (stop db)
    - There are other command check package.json in root (scripts)

- create a .env file in apps/backend and copy code in .env.template
    - .env file should never be pushed to github, always push template 
- go back to root (../..)
- run "npm run dev:backend" to start up backend
- run "npm run dev:frontend" to start up frontend


## Start up prisma
- Make sure you have ran "npm run db:up" 
- Navigate to apps/backend and run "npx prisma migrate dev --name init"
- Then run "npm run prisma:studio" this opens up prisma studio where you can view db. (Never manually edit db, editing types etc)
- Look up how to use prisma studio

### Optional (create a table, migrate and add some info) only for Database team
- First make sure prisma is installed in vscode extensions
- Open schema.prisma in prisma file
- create a table eg model firstTable {<br>
  id    Int    @id @default(autoincrement())<br>
  email String @unique<br>
  name  String?<br>
}<br>
- run "npm run prisma:migrate or npx prisma migrate dev --name any-comment-you-want"
- run "npm run prisma:studio" again 
- you should see table a table below "prisma_migration" in which you can add new entries etc.
- check migrations folder, should see some sql code and a migration toml file, commit the folder
- Learn some prisma, or how to write raw sql using prisma (writing raw sql is typically not recommended but can be useful).


