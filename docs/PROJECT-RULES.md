
> **Purpose:** Single source of truth for conventions, patterns, and constraints every developer (human or AI) must follow when contributing to this codebase.
> **Stack:** NestJS · Next.js · TypeScript · Prisma · MySQL · VNPay Sandbox

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Backend Rules — NestJS](#2-backend-rules--nestjs)
3. [Frontend Rules — Next.js](#3-frontend-rules--nextjs)
4. [Database & Prisma Rules](#4-database--prisma-rules)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Design Rules](#6-api-design-rules)
7. [VNPay Integration Rules](#7-vnpay-integration-rules)
8. [TypeScript Rules](#8-typescript-rules)
9. [Error Handling](#9-error-handling)
10. [Naming Conventions](#10-naming-conventions)
11. [Git & Collaboration](#11-git--collaboration)
12. [Environment & Config](#12-environment--config)
13. [What NOT To Do](#13-what-not-to-do)

---

## 1. Project Structure

### Backend (`/backend/src/`)

```
src/
├── main.ts                   # Bootstrap only — no business logic here
├── app.module.ts             # Root module — import modules here, nothing else
├── config/                   # NestJS ConfigModule setup
├── database/prisma/          # PrismaModule (global) + PrismaService
├── common/                   # Shared guards, decorators, enums, pipes
│   ├── guards/               # jwt-auth.guard.ts · roles.guard.ts
│   ├── decorators/           # @Roles() · @CurrentUser()
│   └── enums/                # role.enum.ts · booking-status.enum.ts
└── modules/                  # One folder per domain module
    └── <module>/
        ├── <module>.module.ts
        ├── <module>.controller.ts
        ├── <module>.service.ts
        ├── dto/
        └── entities/         # Only if types beyond Prisma are needed
```

### Frontend (`/frontend/src/`)

```
src/
├── app/                      # Next.js App Router — pages only, no business logic
│   ├── (auth)/               # login, register (route group, no URL segment)
│   ├── rooms/
│   ├── bookings/
│   ├── payment/
│   ├── profile/
│   └── admin/                # EMPLOYEE / ADMIN only
├── components/
│   ├── ui/                   # shadcn/ui base components — do not modify directly
│   ├── rooms/
│   ├── bookings/
│   └── layout/
└── lib/
    ├── api.ts                # ALL API calls go through here
    ├── auth.ts               # JWT helpers, session management
    └── utils.ts              # cn(), formatVND(), formatDate()
```

**Rules:**
- Every new domain gets its own folder under `modules/` (backend) or `components/<domain>/` (frontend)
- `app/` pages are thin — they call components and `lib/api.ts`, no raw `fetch()` calls inside pages
- `common/` is for truly shared code only — do not dump module-specific code here

---

## 2. Backend Rules — NestJS

### Module isolation

- Each module **only imports what it directly needs** — see the dependency graph in `ARCHITECTURE.md §8`
- **Circular imports are not allowed** — if A needs B and B needs A, extract the shared logic into a third module or `common/`
- Expose services via the module's `exports` array — do not reach into another module's service directly

```typescript
// ✅ Correct — BookingsModule imports what it needs
@Module({
  imports: [RoomsModule, ServicesModule, VouchersModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
```

### Controllers

- Controllers handle **HTTP only** — routing, request validation, response shaping
- No business logic in controllers — delegate everything to the service
- Always use DTOs with `class-validator` decorators for request bodies
- Return plain objects or Prisma types — do not return raw Prisma models with sensitive fields (e.g. `password`)

```typescript
// ✅ Correct
@Post()
async createBooking(
  @Body() dto: CreateBookingDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.bookingsService.create(dto, user.sub);
}

// ❌ Wrong — business logic in controller
@Post()
async createBooking(@Body() dto: CreateBookingDto) {
  const room = await this.prisma.room.findUnique(...);
  if (!room.isActive) throw new BadRequestException(...);
  // ...
}
```

### Services

- All database access goes through **PrismaService** injected into the service
- Wrap multi-step operations (e.g. create booking + block room dates) in a **Prisma transaction**
- Services must be **stateless** — no instance-level mutable state

```typescript
// ✅ Correct — transaction for booking creation
async create(dto: CreateBookingDto, userId: number) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Check availability
    // 2. Create booking
    // 3. Create BookingService rows
  });
}
```

### DTOs

- Every request body must have a dedicated DTO file under `dto/`
- Use `class-validator` + `class-transformer` — `ValidationPipe({ whitelist: true })` is global
- Use `@ApiProperty()` on every DTO field for Swagger documentation
- Name pattern: `create-<resource>.dto.ts`, `update-<resource>.dto.ts`, `query-<resource>.dto.ts`

```typescript
// dto/create-booking.dto.ts
export class CreateBookingDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  roomId: number;

  @ApiProperty({ example: '2025-12-24' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2025-12-27' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  serviceIds?: number[];
}
```

---

## 3. Frontend Rules — Next.js

### Pages (App Router)

- Pages are **Server Components by default** — only add `'use client'` when you need interactivity (state, events, browser APIs)
- No raw `fetch()` in page files — import from `lib/api.ts`
- Admin pages (`/admin/*`) must check role on the server side — redirect to `/` if unauthorized

### API calls — `lib/api.ts`

- **All** API calls must go through the typed wrapper in `lib/api.ts`
- Never hardcode `http://localhost:4000` in components — always use `NEXT_PUBLIC_API_URL`
- Handle 401 responses globally — redirect to `/login`

```typescript
// lib/api.ts — example typed wrapper
export async function getRooms(params: RoomSearchParams): Promise<Room[]> {
  const query = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms?${query}`);
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}
```

### Components

- Use **shadcn/ui** base components from `components/ui/` — do not copy-paste shadcn code inline
- Do not modify files inside `components/ui/` — override styles via Tailwind className props
- Domain components go in `components/<domain>/` (e.g. `components/rooms/RoomCard.tsx`)
- Component files: PascalCase (`RoomCard.tsx`), one component per file

### Utilities — `lib/utils.ts`

- Currency: always use `formatVND(amount: number): string` — never format currency inline
- Dates: always use `formatDate(date: string | Date): string`
- Class merging: always use `cn()` (re-exports `clsx` + `tailwind-merge`)

```typescript
// ✅ Correct
<span>{formatVND(room.pricePerNight)}</span>

// ❌ Wrong
<span>{room.pricePerNight.toLocaleString('vi-VN')} VND</span>
```

---

## 4. Database & Prisma Rules

### Schema

- All schema changes go in `prisma/schema.prisma` — never alter the DB directly
- Run `npx prisma migrate dev --name <description>` for every schema change
- Migration names must be descriptive: `add_voucher_discount_field`, not `update1`
- Always add **required DB indexes** for query performance:
  - `Booking`: composite index on `(roomId, checkIn, checkOut)`, `userId`, `status`
  - `Payment`: index on `vnpayTxnRef`

### Prisma usage

- Use PrismaService (injected) — never instantiate `new PrismaClient()` outside `prisma.service.ts`
- **Select only what you need** — avoid `findMany()` without a `select` or `include` on large tables
- **Never expose** raw Prisma models to the HTTP response if they contain `password` or sensitive fields — use `select` or map to a response DTO
- Use `$transaction` for any operation that involves more than one write

```typescript
// ✅ Correct — exclude password
const user = await this.prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true, role: true },
});

// ❌ Wrong — password leaked
const user = await this.prisma.user.findUnique({ where: { id } });
return user;
```

### Price snapshots

- When creating a `BookingService` row, always snapshot the current `service.price` into `BookingService.price`
- Reason: service prices may change in the future — historical bookings must reflect the price at time of booking

---

## 5. Authentication & Authorization

### Guards — always apply in this order

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
```

1. `JwtAuthGuard` validates the token first
2. `RolesGuard` then checks the role from the token payload

### JWT payload shape

```typescript
interface JwtPayload {
  sub: number;    // userId
  email: string;
  role: Role;     // GUEST | EMPLOYEE | ADMIN
}
```

- Never put sensitive data (password hash, internal IDs beyond userId) in the JWT payload
- Token expiry: 7 days (`JWT_EXPIRES_IN=7d`)

### RBAC rules

| Route type | Required guard |
|-----------|---------------|
| Public (room search, auth) | None |
| Guest actions (my bookings, profile) | `JwtAuthGuard` |
| EMPLOYEE+ actions (all bookings, CRUD rooms) | `JwtAuthGuard` + `@Roles(Role.EMPLOYEE, Role.ADMIN)` |
| ADMIN-only (user management) | `JwtAuthGuard` + `@Roles(Role.ADMIN)` |

- **RBAC is always enforced server-side** — frontend role checks are UI sugar only
- A GUEST must only access their own bookings — validate `booking.userId === req.user.sub` in the service, not just the controller

---

## 6. API Design Rules

### URL conventions

- All endpoints are prefixed with `/api` (global prefix in `main.ts`)
- Use **kebab-case** for multi-word paths: `/room-types`, `/booking-services`
- Use **nouns**, not verbs: `/bookings`, not `/createBooking`
- Specific actions use sub-resources: `PATCH /bookings/:id/cancel`, not `DELETE /bookings/:id`

### HTTP methods

| Action | Method |
|--------|--------|
| Create | `POST` |
| Read (list) | `GET` |
| Read (single) | `GET /:id` |
| Full update | `PUT /:id` |
| Partial update | `PATCH /:id` |
| Delete | `DELETE /:id` |
| Custom action | `PATCH /:id/<action>` |

### Response shape

Always return consistent shapes:

```typescript
// Success — single resource
{ data: { id, ... } }

// Success — list
{ data: [...], total: number, page: number }

// Error (handled by NestJS exception filters)
{ statusCode: 400, message: "...", error: "Bad Request" }
```

### Swagger

- Every controller must have `@ApiTags('<module>')` 
- Every endpoint must have `@ApiOperation({ summary: '...' })`
- Every DTO field must have `@ApiProperty()`
- Access Swagger at `http://localhost:4000/api/docs` during development

---

## 7. VNPay Integration Rules

These rules are **critical** — bugs here affect real money flow.

- **Never** use the return URL (`/api/payments/vnpay-return`) to confirm a booking — it is for UI display only
- **Always** confirm bookings via the IPN webhook (`POST /api/payments/vnpay-ipn`) which is server-to-server
- **Always** verify the HMAC-SHA512 signature on every IPN request before processing
- **Idempotency:** check that `vnpayTxnRef` does not already exist in the DB before processing — return `{ RspCode: "00" }` if already processed (do not error)
- Store `vnpayResponseCode` in the `Payment` record for debugging
- In local dev, use **ngrok** to expose port 4000 for IPN callbacks from VNPay Sandbox

```typescript
// ✅ Correct IPN handler pattern
async handleIPN(ipnData: VNPayIPNDto) {
  // 1. Verify HMAC signature — reject if invalid
  // 2. Find payment by vnpayTxnRef — 404 if not found
  // 3. Check if already SUCCESS — return { RspCode: "00" } if so (idempotent)
  // 4. Update Payment.status = SUCCESS
  // 5. Update Booking.status = CONFIRMED (in same transaction)
  // 6. Return { RspCode: "00", Message: "Confirm Success" }
}
```

---

## 8. TypeScript Rules

- **Strict mode is on** — `"strict": true` in `tsconfig.json` — no exceptions
- No `any` — use `unknown` + type narrowing if the type is truly unknown
- No non-null assertions (`!`) without a comment explaining why it's safe
- Prefer `interface` for object shapes, `type` for unions/intersections
- All enums live in `common/enums/` and are imported from there — never redefine locally

```typescript
// ✅ Correct
function getUser(id: number): Promise<UserResponse | null> { ... }

// ❌ Wrong
function getUser(id: any): Promise<any> { ... }
```

---

## 9. Error Handling

### Backend

- Use NestJS built-in HTTP exceptions — do not throw raw `Error` objects from controllers or services
- Common exceptions:

```typescript
throw new NotFoundException('Room not found');
throw new BadRequestException('Room is not available for selected dates');
throw new ForbiddenException('You can only cancel your own bookings');
throw new ConflictException('Email already exists');
```

- For unexpected errors, let them bubble up to the global exception filter — do not swallow errors with empty `catch` blocks

### Frontend

- Wrap API calls in try/catch — display user-friendly Vietnamese error messages (not raw server errors)
- Never `console.log` errors in production code — use a proper error boundary or toast notification
- Payment failures must show a clear message and offer a retry path

---

## 10. Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files (backend) | `kebab-case` | `create-booking.dto.ts` |
| Files (frontend) | `PascalCase` for components, `camelCase` for utils | `RoomCard.tsx`, `api.ts` |
| Classes | `PascalCase` | `BookingsService` |
| Variables / functions | `camelCase` | `totalPrice`, `createBooking()` |
| Constants | `UPPER_SNAKE_CASE` | `JWT_EXPIRES_IN` |
| DB columns (Prisma) | `camelCase` in schema | `pricePerNight`, `checkIn` |
| Enums | `PascalCase` name, `UPPER_SNAKE_CASE` values | `BookingStatus.PENDING` |
| API paths | `kebab-case` | `/room-types`, `/booking-services` |
| React components | `PascalCase` | `BookingForm`, `RoomGallery` |
| Hooks | `use` prefix + `camelCase` | `useRoomSearch`, `useAuth` |

---

## 11. Git & Collaboration

### Branch naming

```
main            — production-ready code only
develop         — integration branch
feature/<name>  — new features     e.g. feature/vnpay-integration
fix/<name>      — bug fixes        e.g. fix/double-booking-race
chore/<name>    — tooling, config  e.g. chore/update-prisma
```

### Commit messages (Conventional Commits)

```
feat(bookings): add cancellation endpoint
fix(payments): handle duplicate IPN callbacks
chore(prisma): add index on booking status
docs(api): update Swagger tags for admin module
refactor(auth): extract token validation to helper
```

Format: `<type>(<scope>): <short description>`
Types: `feat` · `fix` · `chore` · `docs` · `refactor` · `test`

### PR rules

- PRs require **at least 1 review** before merging to `develop`
- PRs must pass TypeScript compilation (`tsc --noEmit`) — no type errors
- PR description must reference the FR being implemented (e.g. `Implements FR-003`)
- Keep PRs focused — one feature or fix per PR

---

## 12. Environment & Config

### Backend `.env` (never commit this file)

```env
DATABASE_URL="mysql://user:password@localhost:3306/dtuvivi"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=4000
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/return
VNPAY_IPN_URL=http://your-ngrok-url/api/payments/vnpay-ipn
```

### Frontend `.env.local` (never commit this file)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Rules

- Access env vars via `ConfigService` (backend) or `process.env.NEXT_PUBLIC_*` (frontend) — never hardcode values
- Provide a `.env.example` file with all keys and placeholder values — keep it updated
- Prefix all frontend-exposed vars with `NEXT_PUBLIC_` — never expose secrets client-side
- `JWT_SECRET` and `VNPAY_HASH_SECRET` must be **strong random strings** — never use the example values in production

---

## 13. What NOT To Do

These are the most common mistakes to avoid:

| ❌ Don't | ✅ Do instead |
|---------|--------------|
| Put business logic in controllers | Put it in services |
| Return raw Prisma user objects (contains `password`) | Use `select` or map to a response DTO |
| Create circular module imports | Extract shared logic to a third module |
| Confirm bookings via return URL | Confirm only via IPN webhook |
| Skip HMAC verification on IPN | Always verify signature first |
| Use `any` type | Use proper types or `unknown` |
| Hardcode API URLs in components | Use `lib/api.ts` + `NEXT_PUBLIC_API_URL` |
| Format currency inline (`toLocaleString`) | Use `formatVND()` from `lib/utils.ts` |
| Write multiple writes outside a transaction | Use `prisma.$transaction()` |
| Commit `.env` files | Add to `.gitignore`, maintain `.env.example` |
| Modify `components/ui/` shadcn files | Override via Tailwind className props |
| Rely on frontend RBAC only | Always enforce RBAC server-side |
| Process duplicate IPN callbacks | Check `vnpayTxnRef` uniqueness first |

---
