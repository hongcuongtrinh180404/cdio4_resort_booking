# Data Schema Document — DTUVIVI

> **Database:** MySQL 8
> **ORM:** Prisma
> **Architecture:** Modular Monolith
> **Version:** MVP

---

## 1. Overview

The database schema supports the core business processes of the DTUVIVI resort booking platform:

- User authentication and profile management
- Room and room type management
- Room booking and reservation lifecycle
- Additional service and service combo purchases
- Voucher and discount management
- VNPay payment integration
- Wishlist management
- Administrative operations

The system is designed for a **single resort** (single-tenant architecture).

---

## 2. Entity Relationship Overview

```
User
│
├── Booking
│     ├── BookingService  ──→ Service ←── ServiceComboItem ←── ServiceCombo
│     ├── BookingCombo    ──────────────────────────────────→ ServiceCombo
│     └── Payment
│
└── Wishlist ──→ Room

RoomType ──→ Room ──→ RoomImage

Voucher ──→ Booking
```

---

## 3. User Domain

### User

Stores guest and staff accounts.

| Field     | Type     | Constraints         |
|-----------|----------|---------------------|
| id        | Int      | Primary Key         |
| email     | String   | Unique, Required    |
| password  | String   | Required (bcrypt)   |
| fullName  | String   | Required            |
| phone     | String   | Nullable            |
| address   | String   | Nullable            |
| role      | UserRole | Default: GUEST      |
| createdAt | DateTime | Auto generated      |
| updatedAt | DateTime | Auto updated        |

**Relationships:**
```
User
├── Bookings[]
└── Wishlist[]
```

---

## 4. Room Domain

### RoomType

Represents room categories.

**Examples:** Deluxe · Suite · Villa · Ocean View

| Field       | Type     | Constraints    |
|-------------|----------|----------------|
| id          | Int      | Primary Key    |
| name        | String   | Unique         |
| description | String   | Nullable       |
| createdAt   | DateTime | Auto generated |
| updatedAt   | DateTime | Auto updated   |

---

### Room

Represents a physical room in the resort.

| Field         | Type       | Constraints    |
|---------------|------------|----------------|
| id            | Int        | Primary Key    |
| roomNumber    | String     | Unique         |
| name          | String     | Required       |
| roomTypeId    | Int        | FK → RoomType  |
| description   | Text       | Nullable       |
| capacity      | Int        | Required       |
| pricePerNight | Decimal    | Required       |
| status        | RoomStatus | Default: AVAILABLE |
| createdAt     | DateTime   | Auto generated |
| updatedAt     | DateTime   | Auto updated   |

**Relationships:**
```
Room
├── RoomImages[]
├── Bookings[]
└── Wishlist[]
```

---

### RoomImage

Stores room gallery images. Each room can have multiple images with display order control.

> **Design decision:** A dedicated table (not a JSON column) is used so that images can be added,
> deleted, or reordered individually without rewriting the full array. This also enables proper
> indexing and Prisma relation typing.

| Field     | Type   | Constraints       |
|-----------|--------|-------------------|
| id        | Int    | Primary Key       |
| roomId    | Int    | FK → Room         |
| imageUrl  | String | Required          |
| sortOrder | Int    | Default: 0        |

---

## 5. Service Domain

### Service

Represents individual add-on services offered by the resort.

**Examples:** Breakfast · Airport Transfer · Spa · Massage Couple · Coral Diving Tour · Romantic Beach Dinner

| Field       | Type     | Constraints    |
|-------------|----------|----------------|
| id          | Int      | Primary Key    |
| name        | String   | Unique         |
| description | Text     | Nullable       |
| price       | Decimal  | Required       |
| isActive    | Boolean  | Default: true  |
| createdAt   | DateTime | Auto generated |
| updatedAt   | DateTime | Auto updated   |

---

## 6. Service Combo Domain

### ServiceCombo

Represents bundled service packages sold at a combined price.

**Examples:**

- **Honeymoon Package** — Massage Couple + Romantic Beach Dinner
- **Adventure Package** — Coral Diving Tour + Airport Transfer

| Field       | Type     | Constraints    |
|-------------|----------|----------------|
| id          | Int      | Primary Key    |
| name        | String   | Unique         |
| description | Text     | Nullable       |
| comboPrice  | Decimal  | Required       |
| isActive    | Boolean  | Default: true  |
| createdAt   | DateTime | Auto generated |
| updatedAt   | DateTime | Auto updated   |

---

### ServiceComboItem

Junction table linking ServiceCombo to its included Services.

| Field     | Type | Constraints              |
|-----------|------|--------------------------|
| comboId   | Int  | FK → ServiceCombo        |
| serviceId | Int  | FK → Service             |

**Primary key:** `(comboId, serviceId)`

---

## 7. Voucher Domain

### Voucher

Represents promotional discount codes.

| Field         | Type                | Constraints    |
|---------------|---------------------|----------------|
| id            | Int                 | Primary Key    |
| code          | String              | Unique         |
| description   | Text                | Nullable       |
| discountType  | VoucherDiscountType | Required       |
| discountValue | Decimal             | Required       |
| maxUsage      | Int                 | Required       |
| usedCount     | Int                 | Default: 0     |
| startDate     | DateTime            | Required       |
| endDate       | DateTime            | Required       |
| isActive      | Boolean             | Default: true  |
| createdAt     | DateTime            | Auto generated |
| updatedAt     | DateTime            | Auto updated   |

**Voucher validity rules** (all must be true):
- `isActive = true`
- Current date is within `startDate` and `endDate`
- `usedCount < maxUsage`

---

## 8. Booking Domain

### Booking

Represents a room reservation.

| Field             | Type          | Constraints         |
|-------------------|---------------|---------------------|
| id                | Int           | Primary Key         |
| bookingCode       | String        | Unique (e.g. BK202600001) |
| userId            | Int           | FK → User           |
| roomId            | Int           | FK → Room           |
| voucherId         | Int           | FK → Voucher, Nullable |
| status            | BookingStatus | Default: PENDING    |
| checkInDate       | DateTime      | Required            |
| checkOutDate      | DateTime      | Required            |
| numberOfNights    | Int           | Required            |
| roomPricePerNight | Decimal       | Snapshot            |
| serviceTotal      | Decimal       | Snapshot            |
| comboTotal        | Decimal       | Snapshot            |
| discountAmount    | Decimal       | Snapshot            |
| totalAmount       | Decimal       | Snapshot            |
| expiresAt         | DateTime      | PENDING expires after 30 min |
| createdAt         | DateTime      | Auto generated      |
| updatedAt         | DateTime      | Auto updated        |

**Snapshot fields** — written once at booking creation, never updated afterward:
```
roomPricePerNight · serviceTotal · comboTotal · discountAmount · totalAmount
```
This ensures historical accuracy even if room or service prices change later.

**Total amount formula:**
```
totalAmount = (numberOfNights × roomPricePerNight)
            + serviceTotal
            + comboTotal
            - discountAmount
```

**Relationships:**
```
Booking
├── BookingServices[]
├── BookingCombos[]
└── Payment (1:1)
```

---

### BookingService

Stores purchased add-on services for a booking.

| Field         | Type    | Constraints              |
|---------------|---------|--------------------------|
| id            | Int     | Primary Key              |
| bookingId     | Int     | FK → Booking             |
| serviceId     | Int     | FK → Service             |
| quantity      | Int     | Required (e.g. 5 for "Massage Couple × 5") |
| priceSnapshot | Decimal | Price per unit at booking time |

**Unique constraint:** `(bookingId, serviceId)`

---

### BookingCombo

Stores purchased service combo packages for a booking.

| Field              | Type    | Constraints              |
|--------------------|---------|--------------------------|
| id                 | Int     | Primary Key              |
| bookingId          | Int     | FK → Booking             |
| comboId            | Int     | FK → ServiceCombo        |
| quantity           | Int     | Required (e.g. 2 for "Honeymoon Package × 2") |
| comboPriceSnapshot | Decimal | Price per unit at booking time |

**Unique constraint:** `(bookingId, comboId)`

> **Business rule:** The system records purchased combo information only. Scheduling and
> execution of services within a combo are coordinated manually by resort staff after check-in.

---

## 9. Payment Domain

### Payment

Stores VNPay payment records.

| Field             | Type           | Constraints            |
|-------------------|----------------|------------------------|
| id                | Int            | Primary Key            |
| bookingId         | Int            | Unique FK → Booking    |
| amount            | Decimal        | Required               |
| gateway           | PaymentGateway | Default: VNPAY         |
| transactionRef    | String         | Unique (VNPay vnp_TxnRef) |
| vnpayResponseCode | String         | Nullable (for debugging) |
| status            | PaymentStatus  | Default: PENDING       |
| paidAt            | DateTime       | Nullable               |
| createdAt         | DateTime       | Auto generated         |

**Relationship:**
```
Booking 1 ──── 1 Payment
```

**Business rules:**
- One booking has exactly one payment record
- Payment record is created when the booking is created (`status = PENDING`)
- VNPay IPN callback updates `status` to `SUCCESS` or `FAILED`
- IPN processing must be idempotent — check `transactionRef` uniqueness before processing
- Never trust the frontend return URL to confirm a booking; always rely on IPN only

---

## 10. Wishlist Domain

### Wishlist

Stores rooms saved by guests for future reference.

| Field     | Type     | Constraints     |
|-----------|----------|-----------------|
| id        | Int      | Primary Key     |
| userId    | Int      | FK → User       |
| roomId    | Int      | FK → Room       |
| createdAt | DateTime | Auto generated  |

**Unique constraint:** `(userId, roomId)` — a room can only appear once per user's wishlist.

---

## 11. Enum Definitions

### UserRole
```
GUEST       — resort customer
EMPLOYEE    — resort staff
ADMIN       — system administrator
```

### RoomStatus
```
AVAILABLE    — room is bookable
MAINTENANCE  — room is under maintenance, not bookable
INACTIVE     — room is disabled
```

### BookingStatus
```
PENDING      — booking created, awaiting payment (expires after 30 min)
CONFIRMED    — payment successful
CHECKED_IN   — guest has physically checked in (updated by staff)
CHECKED_OUT  — guest has checked out (updated by staff)
CANCELLED    — cancelled by guest, staff, or 30-min payment timeout
```

### PaymentStatus
```
PENDING   — payment initiated
SUCCESS   — payment confirmed via VNPay IPN
FAILED    — payment failed
```

### PaymentGateway
```
VNPAY
```

### VoucherDiscountType
```
PERCENTAGE    — e.g. 10% off totalAmount
FIXED_AMOUNT  — e.g. 300,000 VND off totalAmount
```

---

## 12. Business Rules

### Room Availability

A room cannot be booked if any existing booking with overlapping dates has one of these statuses:

```
PENDING · CONFIRMED · CHECKED_IN
```

Availability check must be performed inside a `prisma.$transaction()` to prevent race conditions.

---

### Booking Expiration

If payment is not completed within 30 minutes of booking creation:

```
PENDING → CANCELLED
```

Room becomes available again. Implementation: scheduled job checks `expiresAt < now` on `PENDING` bookings.

---

### Booking Status Transitions

| From | To | Who |
|---|---|---|
| — | `PENDING` | Guest (booking creation) |
| `PENDING` | `CONFIRMED` | System (VNPay IPN) |
| `PENDING` | `CANCELLED` | Guest / System (timeout) |
| `CONFIRMED` | `CHECKED_IN` | Staff (EMPLOYEE / ADMIN) |
| `CONFIRMED` | `CANCELLED` | Guest / Staff |
| `CHECKED_IN` | `CHECKED_OUT` | Staff (EMPLOYEE / ADMIN) |

---

### Voucher Validation

A voucher is valid only when all three conditions are met:

```
isActive = true
AND startDate ≤ now ≤ endDate
AND usedCount < maxUsage
```

After a booking using the voucher is confirmed, `usedCount` increments by 1.

---

### Service and Combo Quantities

Guests may purchase multiple units of the same service or combo:

```
Massage Couple × 5
Spa Premium × 3
Honeymoon Package × 2
```

Quantities are recorded in `BookingService.quantity` and `BookingCombo.quantity`. Actual service
scheduling is coordinated manually by staff after guest check-in.

---

### Payment Lifecycle

```
Create Booking
      │
      ▼
Create Payment (status: PENDING)
      │
      ▼
Redirect to VNPay Sandbox
      │
      ▼
VNPay sends IPN (POST, server-to-server)
      │
      ├── Verify HMAC signature
      ├── Check transactionRef not already processed
      │
      ▼
Payment → SUCCESS  |  Booking → CONFIRMED
```