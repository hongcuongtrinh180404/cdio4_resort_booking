> **Stack:** NestJS · Next.js · TypeScript · Prisma · MySQL · VNPay Sandbox

---

## 1. System Overview

DTUVIVI is a **single-tenant** resort booking platform (one resort only). Built as a **Modular Monolith** — clear module boundaries are enforced to allow future migration to microservices.

```
┌─────────────────────────────────────────────┐
│              Browser (Guest / Staff)         │
│        Next.js · TypeScript · Tailwind CSS   │
│              shadcn/ui components            │
└──────────────────┬──────────────────────────┘
                   │ HTTP REST (JSON) · Bearer JWT
                   │ CORS: localhost:3000
┌──────────────────▼──────────────────────────┐
│           NestJS API  —  port 4000           │
│         Global prefix: /api                  │
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐   │
│  │  Auth   │ │  Users  │ │    Rooms     │   │
│  ├─────────┤ ├─────────┤ ├──────────────┤   │
│  │Services │ │Bookings │ │   Payments   │   │
│  ├─────────┤ ├─────────┤ ├──────────────┤   │
│  │Vouchers │ │Wishlist │ │    Admin     │   │
│  └─────────┘ └─────────┘ └──────────────┘   │
│                                              │
│              Prisma ORM                      │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │     MySQL 8        │
         └────────────────────┘

         ┌────────────────────┐
         │   VNPay Sandbox    │  ← IPN webhook callback
         └────────────────────┘
```

---

## 2. Backend Module Structure

```
src/
├── main.ts                          # Bootstrap: CORS, /api prefix, ValidationPipe, Swagger
├── app.module.ts                    # Root module
│
├── config/
│   └── config.module.ts             # Global env config (NestJS ConfigModule)
│
├── database/
│   └── prisma/
│       ├── prisma.module.ts         # Global module
│       └── prisma.service.ts        # PrismaClient (onModuleInit / onModuleDestroy)
│
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # Validates JWT token
│   │   └── roles.guard.ts           # Enforces RBAC role check
│   ├── decorators/
│   │   ├── roles.decorator.ts       # @Roles(Role.ADMIN)
│   │   └── current-user.decorator.ts
│   └── enums/
│       ├── role.enum.ts             # GUEST | EMPLOYEE | ADMIN
│       └── booking-status.enum.ts   # PENDING | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED
│
└── modules/
    ├── auth/                        # FR-001: register, login, password reset
    ├── users/                       # FR-007: profile, my-bookings, wishlist
    ├── rooms/                       # FR-002: search rooms by date / type / capacity
    ├── room-types/                  # Room type management (ADMIN)
    ├── services/                    # FR-005: add-on services (breakfast, airport transfer...)
    ├── service-combos/              # Service combo packages
    ├── bookings/                    # FR-003, FR-004: create / cancel bookings
    ├── payments/                    # FR-006: VNPay integration, IPN handling
    ├── vouchers/                    # Discount vouchers
    ├── wishlist/                    # Guest saved rooms
    └── admin/                       # FR-008: dashboard, revenue reports
```

### Module internal structure

```
modules/bookings/
├── bookings.module.ts
├── bookings.controller.ts
├── bookings.service.ts
├── dto/
│   ├── create-booking.dto.ts
│   ├── update-booking-status.dto.ts
│   └── query-booking.dto.ts
└── entities/
    └── booking.entity.ts            # (optional — only if a type beyond Prisma is needed)
```

---

## 3. Frontend Structure

```
src/
├── app/                             # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                     # Home / room search page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── rooms/
│   │   ├── page.tsx                 # Room listing (FR-002)
│   │   └── [id]/page.tsx            # Room detail
│   ├── bookings/
│   │   ├── new/page.tsx             # Create booking (FR-003)
│   │   └── [id]/page.tsx            # Booking detail
│   ├── payment/
│   │   ├── page.tsx                 # Redirect to VNPay
│   │   └── return/page.tsx          # VNPay callback return
│   ├── profile/
│   │   ├── page.tsx                 # Personal info (FR-007)
│   │   ├── bookings/page.tsx        # My Bookings tab
│   │   ├── vouchers/page.tsx        # My Vouchers tab
│   │   └── wishlist/page.tsx        # Wishlist tab
│   └── admin/                       # FR-008: EMPLOYEE / ADMIN only
│       ├── dashboard/page.tsx
│       ├── rooms/page.tsx
│       ├── bookings/page.tsx
│       └── reports/page.tsx
│
├── components/
│   ├── ui/                          # shadcn/ui base components
│   ├── rooms/                       # RoomCard, RoomFilter, RoomGallery...
│   ├── bookings/                    # BookingForm, BookingSummary...
│   └── layout/                      # Navbar, Footer, Sidebar...
│
└── lib/
    ├── api.ts                       # Typed fetch wrapper → NEXT_PUBLIC_API_URL
    ├── auth.ts                      # JWT helpers, session management
    └── utils.ts                     # cn(), formatVND(), formatDate()...
```

---

## 4. Data Models (Prisma Schema)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  fullName  String
  phone     String?
  address   String?
  role      UserRole @default(GUEST)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bookings Booking[]
  wishlist Wishlist[]
}

model RoomType {
  id          Int      @id @default(autoincrement())
  name        String   @unique  // e.g. "Deluxe", "Suite", "Villa"
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  rooms Room[]
}

model Room {
  id            Int        @id @default(autoincrement())
  roomNumber    String     @unique
  name          String
  roomTypeId    Int
  roomType      RoomType   @relation(fields: [roomTypeId], references: [id])
  description   String?    @db.Text
  capacity      Int
  pricePerNight Decimal    @db.Decimal(10, 2)
  status        RoomStatus @default(AVAILABLE)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  images   RoomImage[]
  bookings Booking[]
  wishlist Wishlist[]
}

model RoomImage {
  id        Int    @id @default(autoincrement())
  roomId    Int
  room      Room   @relation(fields: [roomId], references: [id])
  imageUrl  String
  sortOrder Int    @default(0)
}

model Service {
  id          Int      @id @default(autoincrement())
  name        String   @unique  // e.g. "Breakfast", "Airport Transfer"
  description String?  @db.Text
  price       Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  bookingServices  BookingService[]
  serviceComboItems ServiceComboItem[]
}

model ServiceCombo {
  id          Int      @id @default(autoincrement())
  name        String   @unique  // e.g. "Honeymoon Package"
  description String?  @db.Text
  comboPrice  Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items         ServiceComboItem[]
  bookingCombos BookingCombo[]
}

model ServiceComboItem {
  comboId   Int
  combo     ServiceCombo @relation(fields: [comboId], references: [id])
  serviceId Int
  service   Service      @relation(fields: [serviceId], references: [id])

  @@id([comboId, serviceId])
}

model Voucher {
  id             Int                 @id @default(autoincrement())
  code           String              @unique
  description    String?             @db.Text
  discountType   VoucherDiscountType
  discountValue  Decimal             @db.Decimal(10, 2)
  maxUsage       Int
  usedCount      Int                 @default(0)
  startDate      DateTime
  endDate        DateTime
  isActive       Boolean             @default(true)
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  bookings Booking[]
}

model Booking {
  id                 Int           @id @default(autoincrement())
  bookingCode        String        @unique  // e.g. "BK202600001"
  userId             Int
  user               User          @relation(fields: [userId], references: [id])
  roomId             Int
  room               Room          @relation(fields: [roomId], references: [id])
  voucherId          Int?
  voucher            Voucher?      @relation(fields: [voucherId], references: [id])
  status             BookingStatus @default(PENDING)
  checkInDate        DateTime
  checkOutDate       DateTime
  numberOfNights     Int
  roomPricePerNight  Decimal       @db.Decimal(10, 2)  // snapshot
  serviceTotal       Decimal       @db.Decimal(10, 2)  // snapshot
  comboTotal         Decimal       @db.Decimal(10, 2)  // snapshot
  discountAmount     Decimal       @db.Decimal(10, 2)  // snapshot
  totalAmount        Decimal       @db.Decimal(10, 2)  // snapshot
  expiresAt          DateTime      // PENDING expires after 30 min
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  services BookingService[]
  combos   BookingCombo[]
  payment  Payment?
}

model BookingService {
  id             Int     @id @default(autoincrement())
  bookingId      Int
  booking        Booking @relation(fields: [bookingId], references: [id])
  serviceId      Int
  service        Service @relation(fields: [serviceId], references: [id])
  quantity       Int
  priceSnapshot  Decimal @db.Decimal(10, 2)  // price per unit at time of booking

  @@unique([bookingId, serviceId])
}

model BookingCombo {
  id                  Int          @id @default(autoincrement())
  bookingId           Int
  booking             Booking      @relation(fields: [bookingId], references: [id])
  comboId             Int
  combo               ServiceCombo @relation(fields: [comboId], references: [id])
  quantity            Int
  comboPriceSnapshot  Decimal      @db.Decimal(10, 2)  // price per unit at time of booking

  @@unique([bookingId, comboId])
}

model Payment {
  id               Int            @id @default(autoincrement())
  bookingId        Int            @unique
  booking          Booking        @relation(fields: [bookingId], references: [id])
  amount           Decimal        @db.Decimal(10, 2)
  gateway          PaymentGateway @default(VNPAY)
  transactionRef   String         @unique  // VNPay vnp_TxnRef — used for idempotency
  vnpayResponseCode String?
  status           PaymentStatus  @default(PENDING)
  paidAt           DateTime?
  createdAt        DateTime       @default(now())
}

model Wishlist {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  roomId    Int
  room      Room     @relation(fields: [roomId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, roomId])
}

// ─── Enums ───────────────────────────────────────────────

enum UserRole {
  GUEST
  EMPLOYEE
  ADMIN
}

enum RoomStatus {
  AVAILABLE
  MAINTENANCE
  INACTIVE
}

enum BookingStatus {
  PENDING       // created, awaiting payment
  CONFIRMED     // payment successful
  CHECKED_IN    // guest has checked in — updated by staff
  CHECKED_OUT   // guest has checked out — updated by staff
  CANCELLED     // cancelled by guest, staff, or 30-min timeout
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

enum PaymentGateway {
  VNPAY
}

enum VoucherDiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

---

## 5. Booking Lifecycle

```
Guest selects room + dates + services/combos + voucher
        ↓
POST /api/bookings
        ↓
Booking created  →  status: PENDING  (expiresAt = now + 30 min)
Room blocked for the selected date range
        ↓
POST /api/payments/create-url { bookingId }
        ↓
Redirect → VNPay Sandbox
        ↓
VNPay calls IPN webhook
POST /api/payments/vnpay-ipn  (server-to-server)
        ↓ idempotent check (transactionRef unique)
Booking → CONFIRMED  |  Payment → SUCCESS
        ↓
Staff updates status manually via admin dashboard
        ↓
Booking → CHECKED_IN  →  Booking → CHECKED_OUT

At any point (PENDING or CONFIRMED):
Guest cancels  or  Staff cancels  or  30-min timeout (PENDING only)
        ↓
Booking → CANCELLED, room becomes available again
```

**Price calculation (all values snapshotted at booking creation):**
```
totalAmount = (numberOfNights × roomPricePerNight)
            + serviceTotal   (sum of service.price × quantity)
            + comboTotal     (sum of combo.comboPrice × quantity)
            - discountAmount (from voucher)
```

**Snapshot rule:** `roomPricePerNight`, `serviceTotal`, `comboTotal`, `discountAmount`, `totalAmount`
are written once at booking creation and **never updated**, even if prices change later.

**Preventing double-booking:** On `POST /api/bookings`, wrap availability check + booking creation
in a `prisma.$transaction()`. Query must confirm no existing `Booking` with status
`PENDING`, `CONFIRMED`, or `CHECKED_IN` exists for the same `roomId` with overlapping dates.

---

## 6. Authentication & Authorization

- **Mechanism:** Stateless JWT — Bearer token in the `Authorization` header
- **Token payload:** `{ sub: userId, email, role }`
- **Password hashing:** bcrypt, salt rounds = 10
- **Guards applied in order:**
  1. `JwtAuthGuard` — validates the token
  2. `RolesGuard` — checks the role from the token payload

```typescript
// Example usage in a controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Delete('/users/:id')
deleteUser() { ... }
```

**Permission matrix:**

| Action | GUEST | EMPLOYEE | ADMIN |
|--------|:-----:|:--------:|:-----:|
| Browse & view rooms | ✓ | ✓ | ✓ |
| Create a booking | ✓ | ✓ | ✓ |
| Cancel own booking | ✓ | ✓ | ✓ |
| View / cancel all bookings | ✗ | ✓ | ✓ |
| Update booking status (check-in/out) | ✗ | ✓ | ✓ |
| CRUD rooms, services, combos | ✗ | ✓ | ✓ |
| Manage vouchers | ✗ | ✓ | ✓ |
| Manage user accounts | ✗ | ✗ | ✓ |
| View revenue reports | ✗ | ✓ | ✓ |

---

## 8. Module Dependency Graph

```
AppModule
├── ConfigModule          (global)
├── DatabaseModule        (global — exports PrismaService)
│
├── AuthModule            → UsersModule
├── UsersModule
├── RoomsModule           → RoomTypesModule
├── RoomTypesModule
├── ServicesModule
├── ServiceCombosModule   → ServicesModule
├── BookingsModule        → RoomsModule, ServicesModule, ServiceCombosModule, VouchersModule
├── PaymentsModule        → BookingsModule
├── VouchersModule
├── WishlistModule        → RoomsModule
└── AdminModule           → BookingsModule, UsersModule, RoomsModule, ServicesModule, ServiceCombosModule, VouchersModule
```

> **Rule:** Each module only imports what it directly needs. Circular imports are not allowed.

---

## 9. VNPay Integration

```
1. Guest clicks "Pay"
   → POST /api/payments/create-url { bookingId }
   → Server generates transactionRef (unique), signs with HMAC-SHA512
   → Returns { paymentUrl }

2. Frontend redirects → paymentUrl (VNPay Sandbox)

3. Guest completes payment
   → VNPay calls IPN: POST /api/payments/vnpay-ipn
   → Server verifies HMAC-SHA512 signature — reject if invalid
   → Checks transactionRef has not been processed (idempotent)
   → Updates Payment.status = SUCCESS, Payment.paidAt = now
   → Updates Booking.status = CONFIRMED (same transaction)
   → Returns { RspCode: "00", Message: "Confirm Success" } to VNPay

4. VNPay redirects browser to return URL
   → GET /api/payments/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=...
   → Frontend reads query params and displays result to guest
```

**Critical rules:**
- IPN (`POST /api/payments/vnpay-ipn`) is the **only** trusted source for confirming a booking
- The return URL (`GET /api/payments/vnpay-return`) is for UI display only — never use it to update booking status
- Always verify HMAC-SHA512 signature before processing any IPN request
- `transactionRef` uniqueness in DB prevents double-processing
- In local dev, use [ngrok](https://ngrok.com) to expose port 4000 for IPN callbacks

---

## 10. Environment Variables

**Backend `.env`:**
```env
DATABASE_URL="mysql://user:password@localhost:3306/dtuvivi"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=4000

# VNPay Sandbox
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/return
VNPAY_IPN_URL=http://your-ngrok-url/api/payments/vnpay-ipn
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 11. Non-Functional Constraints

| Concern | Approach |
|---------|---------|
| Performance | Response < 500ms; DB indexes on `roomId + checkInDate + checkOutDate`, `userId`, `status` |
| Concurrency | Check room availability inside a `prisma.$transaction()` to prevent double-booking race conditions |
| Security | HTTPS in production; bcrypt; JWT; RBAC; `ValidationPipe` whitelist; VNPay HMAC-SHA512 verification |
| Scalability | Stateless JWT enables horizontal scaling; Prisma connection pooling |
| Maintainability | TypeScript strict mode; Swagger (`@nestjs/swagger`); enforced module isolation |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| `Booking` | A reservation for a room over a date range, with optional services and combos |
| `Service` | An optional add-on (e.g. Breakfast, Airport Transfer) attached to a booking |
| `ServiceCombo` | A bundled package of services sold at a combined price (e.g. Honeymoon Package) |
| `BookingService` | Junction record between Booking and Service; stores quantity and price snapshot |
| `BookingCombo` | Junction record between Booking and ServiceCombo; stores quantity and price snapshot |
| `Voucher` | A discount code (percentage or fixed amount) applied at checkout |
| `Wishlist` | A guest's saved list of rooms they are interested in |
| `IPN` | Instant Payment Notification — server-to-server webhook from VNPay |
| `transactionRef` | Unique transaction reference sent to VNPay; used for idempotency checks |
| `PENDING` | Booking created, payment not yet completed (expires in 30 min) |
| `CONFIRMED` | Payment successful |
| `CHECKED_IN` | Guest has physically checked in — updated by staff |
| `CHECKED_OUT` | Guest has checked out — updated by staff |
| `CANCELLED` | Cancelled by guest, staff, or 30-minute payment timeout |
| `snapshot` | Price field copied at booking creation time; never updated afterward |