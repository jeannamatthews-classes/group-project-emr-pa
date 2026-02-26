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

- git checkout main
- npm install

### To make sure everything is Good
- npm run db:up (start db)
- npm run db:down (stop db)
    - There are other command check package.json in root (scripts)

- create a .env file in apps/backend and copy code in .env.example
    - .env file should never be pushed to github, always push example template
- go back to root (emr-pa)
- run "npm run dev:backend" to start up backend
- run "npm run dev:frontend" to start up frontend

