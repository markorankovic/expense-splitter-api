# Expense Splitter API

A minimal, production-shaped backend API for splitting expenses in groups.

## Stack
- NestJS (TypeScript)
- Prisma v7
- Postgres (docker-compose)

## Local setup
```bash
npm install
```

## Environment
Create a `.env` file in the project root with at least:
```
DATABASE_URL="postgresql://splitter:splitter@localhost:5432/splitter?schema=public"
JWT_SECRET="change_me"
# Optional
# JWT_EXPIRES_IN="7d"
```

## Database
```bash
# start postgres
docker-compose up -d

# run migrations
npx prisma migrate dev

# (re)generate Prisma client only
npx prisma generate
```

## Run the API
```bash
# dev (watch)
npm run start:dev

# dev (single run)
npm run start
```

## Frontend
The UI lives in `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Then open the URL printed by the dev server (typically `http://localhost:5173`).

How to use the UI:
1. Register multiple accounts by filling in email and password and pressing Register for each account.
2. Log in to one of the accounts.
3. Create a group.
4. Add members by specifying the email of any registered users.
5. Add an expense by filling in the description and the amount in £. Repeat for multiple expenses.

## Tests
```bash
npm test
npm run test:e2e
```

## API overview
Core capabilities:
1. Health check
2. Auth: register/login/JWT + `GET /me`
3. Groups and memberships
4. Expenses and shares
5. Balances and settlement algorithm
6. Pagination and small polish

Use `src/` for controllers/services and `prisma/` for schema and migrations.

## Useful commands
```bash
npm run start:dev
npm test
npm run test:e2e
npx prisma migrate dev
```
