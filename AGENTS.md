# AGENTS.md — Expense Splitter API

## Purpose
This file defines local, repo-specific instructions for Codex/agents working on this project.

## Project goals
- Build a production-shaped but minimal backend API in NestJS.
- Stack: NestJS (TypeScript), Prisma v7, Postgres (docker-compose).
- Keep every change small and testable. Implement one "Page" at a time.
- Store money as integer pence (no floats).

## Workflow rules
1) If a Page is not specified, ask which Page to implement.
2) Implement only what the current Page requires; avoid extra features.
3) Do not refactor unrelated code.
4) Prefer clarity over cleverness; follow standard Nest patterns.
5) Use existing project conventions and folders.
6) After each Page: run tests and commit once they pass.

## Error handling
- 400: validation errors (DTO ValidationPipe)
- 401: invalid credentials
- 403: forbidden (e.g., not a member / not owner)
- 404: missing resources
- 409: conflicts (e.g., duplicate email or membership)

## Security
- Hash passwords with bcrypt (12 rounds).
- JWT secret from .env (JWT_SECRET). Optional JWT_EXPIRES_IN.

## Prisma & DB
- Prisma v7 config uses prisma.config.ts; do not set datasource URL in schema.prisma.
- Use PrismaService wrapper and dependency injection.
- Use migrations via: npx prisma migrate dev
- Do not delete or rewrite migration history.

## Pages (implement in this order)
1) Page 1: Postgres + Prisma + /health (done)
2) Page 2: Auth: register/login/JWT + GET /me (done)
3) Page 3: Groups + Memberships (done)
4) Page 4: Expenses + Shares (done)
5) Page 5: Balances + Settle algorithm (next)
6) Page 6: Pagination + small polish

## Common commands
- Install: npm install
- Dev: npm run start:dev
- Tests: npm test
- E2E: npm run test:e2e
- Migrate: npx prisma migrate dev

## Output expectations for agents
- Provide a concise diff or list of files changed + key snippets.
- Provide exact commands to run (install/migrate/test).
- Provide a minimal test plan (curl or PowerShell examples).
