---
name: dtuvivi
description: DTUVIVI resort booking platform skill
---

# DTUVIVI — Resort Booking Platform

Single-tenant resort booking platform. Tech stack: NestJS + Next.js + Prisma + MySQL + VNPay Sandbox.

## Project Structure

```
/
├── backend/        # NestJS API (port 4000)
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/
│       ├── database/prisma/
│       ├── common/          # guards, decorators, enums
│       └── modules/        # domain modules
├── frontend/       # Next.js App Router
│   └── src/
│       ├── app/            # pages
│       ├── components/     # ui/, rooms/, bookings/, layout/
│       └── lib/            # api.ts, auth.ts, utils.ts
└── docs/           # PRD, ARCHITECTURE, PROJECT-RULES, API-CONTRACTS, DATA-SCHEMA
```

## Core Conventions

### Backend — NestJS
- Modules are isolated in `src/modules/<name>/` with `.module.ts`, `.controller.ts`, `.service.ts`, `dto/`
- Controllers handle HTTP only — no business logic
- Services use PrismaService, wrap multi-step ops in `prisma.$transaction()`
- All DTOs use `class-validator` + `@ApiProperty()` for Swagger
- RBAC: `JwtAuthGuard` + `RolesGuard` with `@Roles()` decorator

### Frontend — Next.js
- Pages are Server Components by default; `'use client'` only when needed
- All API calls go through `lib/api.ts` — no raw `fetch()` in pages
- Use `formatVND()`, `formatDate()`, `cn()` from `lib/utils.ts`
- shadcn/ui in `components/ui/` — do not modify directly

### Database — Prisma
- All schema changes in `prisma/schema.prisma`, run `npx prisma migrate dev --name <desc>`
- Always `select` only needed fields — never expose `password`
- Composite index on Booking `(roomId, checkIn, checkOut)`
- Price snapshots written once at booking creation, never updated

### API Design
- Global prefix: `/api`, kebab-case paths, plural nouns
- Response shape: `{ data }` for single, `{ data, total, page, limit }` for lists
- Error shape: `{ statusCode, message, error }`

### VNPay Integration (Critical)
- IPN webhook is the ONLY trusted source for confirming bookings
- Always verify HMAC-SHA512 signature before processing
- Idempotent: check `transactionRef` uniqueness, return `{ RspCode: "00" }` if already processed
- Return URL is for UI display only — never update booking status from it

### Booking Lifecycle
```
PENDING → CONFIRMED (via IPN) → CHECKED_IN → CHECKED_OUT
  ↓ (timeout/cancel)              ↓ (cancel)
CANCELLED                     CANCELLED
```

### Permission Matrix
| Action | GUEST | EMPLOYEE | ADMIN |
|--------|:-----:|:--------:|:-----:|
| Browse rooms | ✓ | ✓ | ✓ |
| Create/cancel own booking | ✓ | ✓ | ✓ |
| All bookings CRUD | ✗ | ✓ | ✓ |
| Rooms/services/vouchers CRUD | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| Revenue reports | ✗ | ✓ | ✓ |

### TypeScript
- Strict mode, no `any`, prefer `interface` over `type`
- Enums in `common/enums/`, imported globally
- No non-null assertions without comment

### Git
- Branches: `main`, `develop`, `feature/<name>`, `fix/<name>`, `chore/<name>`
- Commits: Conventional Commits — `<type>(<scope>): <desc>`
- PRs need 1 review, pass `tsc --noEmit`, reference FR number

## Related Rules
- Read `.agents/rules/gemini.md` for task routing
- Read `.agents/rules/design.md` for UI design system
- Read `docs/PROJECT-RULES.md` for full conventions
