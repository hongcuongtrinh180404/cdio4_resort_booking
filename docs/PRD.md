# Product Requirements Document — DTUVIVI
## 1. Overview

**DTUVIVI** is a resort booking platform for a **single resort** (single-tenant).

**Core flow:** Guest searches rooms → selects add-on services → pays via VNPay → manages bookings online. Staff manages rooms, services, and reports via an admin dashboard.

- UI language: **Vietnamese** · Currency: **VND** · Payment: **VNPay Sandbox**

---

## 2. Problem & Goals

**Problem:** Traditional booking systems split rooms, services, and support across disconnected tools — fragmented for guests, manual overhead for staff.

**DTUVIVI solves this** by centralizing everything into one flow.

### Goals

| Type | Goal |
|------|------|
| Business | Increase occupancy via online bookings |
| Business | Grow revenue from add-on service packages |
| Business | Reduce manual reservation work for staff |
| User | Book a room + services in a single flow |
| User | Pay online and track booking status independently |
| User | Cancel or adjust reservations without contacting staff |

---

## 3. Roles

| Role | Who | What they can do |
|------|-----|-----------------|
| `GUEST` | Customers | Browse, book, pay, cancel own bookings, manage profile |
| `EMPLOYEE` | Resort staff | View/update all bookings, manage rooms & services, view reports |
| `ADMIN` | System administrator | All of EMPLOYEE + manage user accounts & system config |

---

## 4. Booking Status Flow

```
[Guest books] → PENDING → [Payment success] → CONFIRMED
                    │                               │
                    └──── CANCELLED ←───────────────┘
                     (manual or timeout)
```

| Transition | Trigger | Who |
|-----------|---------|-----|
| → `PENDING` | Guest submits booking | GUEST |
| `PENDING` → `CONFIRMED` | VNPay payment success | System |
| `PENDING` → `CANCELLED` | Guest cancels or 30-min timeout | GUEST / System |
| `CONFIRMED` → `CANCELLED` | Manual cancellation | GUEST, EMPLOYEE, ADMIN |

---

## 5. Functional Requirements

**Priority:** `P0` must-have MVP · `P1` should-have · `P2` nice-to-have

---

### FR-001 — User Authentication `P0`
Users register, log in, and reset password via email.

**Acceptance Criteria:**
- Register with email + password; error if email already exists
- Login returns a valid JWT token
- Password reset works via email link (expires after 1 hour)

---

### FR-002 — Room Search `P0`
Guests search available rooms by date range, capacity, and room type.

**Acceptance Criteria:**
- Filter by: check-in date, check-out date, capacity, room type
- Results show only rooms available in the selected date range
- Each result shows: name, price/night, capacity, type, images, description

---

### FR-003 — Room Booking `P0`
Guest creates a reservation for an available room.

**Acceptance Criteria:**
- Guest selects room, dates, and optional services → confirms booking
- Booking created with `PENDING` status; room is blocked for those dates
- Total price = (nights × price/night) + service prices
- Guest receives booking confirmation

**Error cases:**
- Room already taken for those dates → clear error message
- Room unavailable or not found → error

---

### FR-004 — Booking Cancellation `P1`
Guests or staff cancel a booking.

**Acceptance Criteria:**
- Cancellable from `PENDING` or `CONFIRMED` status
- Status changes to `CANCELLED`; room becomes available again
- Guest can only cancel their own bookings

> Refund policy is out of MVP scope.

---

### FR-005 — Additional Services `P1`
Guests select add-on services (e.g. breakfast, airport transfer) during booking.

**Acceptance Criteria:**
- Service list shows name, description, price
- Guest selects one or more services; total updates in real time
- Selected services are attached to the booking

---

### FR-006 — Payment via VNPay `P0`
Guest pays for their booking through VNPay Sandbox.

**Acceptance Criteria:**
- Guest is redirected to VNPay Sandbox payment page
- On success, booking status updates to `CONFIRMED`
- Payment record is saved and visible in guest profile
- Duplicate payment callbacks are handled gracefully (idempotent)

> VNPay Sandbox only — no real transactions.

---

### FR-007 — User Profile `P1`
Guests view and manage their personal information and activity.

**Acceptance Criteria:**
- Edit personal info: name, phone, address
- **My Bookings tab:** full booking history with status and payment info
- **My Vouchers tab:** active and used vouchers
- **Wishlist tab:** saved rooms; items can be removed

---

### FR-008 — Admin Dashboard `P0`
Staff manage all operational data.

**Acceptance Criteria:**
- Full CRUD: rooms, room types, services
- View and update booking statuses
- Manage user accounts and roles (ADMIN only)
- Revenue reports filterable by date range

---

### FR-009 — Voucher Application P1

Guest can apply a voucher during checkout.

Acceptance Criteria:
- User enters voucher code
- System validates voucher availability
- Discount applied to total price
- Invalid voucher returns clear error message

---

### FR-010 — Wishlist P2

Guest can save rooms for later viewing.

Acceptance Criteria:
- Add room to wishlist
- Remove room from wishlist
- View wishlist

---


## 6. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| Performance | API response < 500ms under normal conditions |
| Scalability | Support ≥ 500 concurrent users |
| Security | JWT auth · bcrypt passwords · HTTPS · RBAC enforced server-side |
| Architecture | Modular Monolith (clean module boundaries for future microservices migration) |
| Maintainability | TypeScript strict mode · Swagger API docs · clear module separation |

---

## 7. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | MySQL 8 |
| Auth | JWT |
| Payment | VNPay Sandbox |

---

## 8. Out of Scope — MVP

| Feature | Where it belongs |
|---------|-----------------|
| AI Concierge / Recommendations | Post-MVP — see section 9 |
| Multi-language / multi-currency | Out of scope |
| Guest reviews & ratings | Out of scope |
| Mobile application | Responsive web is sufficient |
| Refund logic | No policy defined yet |

---

## 9. Post-MVP — AI Features

| Feature | Description |
|---------|-------------|
| AI Concierge | Chat assistant to help guests find and book rooms |
| Recommendation Engine | Suggests rooms/services based on preferences and budget |
| AI Package Builder | Auto-proposes service bundles |
| AI Booking Assistant | Completes bookings via chat |

*Planned infrastructure: Redis · OpenAI API · Qdrant Vector DB*

---

## 10. Success Metrics

| Group | Metric |
|-------|--------|
| Business | Completed bookings/month · service attachment rate |
| Product | Booking completion rate · payment success rate |
| Future AI | AI recommendation acceptance rate |

---

## 11. Open Questions

| # | Question | Owner |
|---|----------|-------|
| 1 | Cancellation/refund policy for `CONFIRMED` bookings? | Product |
| 2 | 30-min payment timeout — is this configurable? | Tech |
| 3 | Email sent on booking creation or only after payment confirmation? | Product |
| 4 | Can EMPLOYEE make bookings on behalf of guests? | Product |
| 5 | Target hosting environment? | Tech |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **Booking** | A reservation for a specific room and date range |
| **Service / Add-on** | Optional service (e.g. breakfast, transfer) added to a booking |
| **Voucher** | Discount code applied at checkout |
| **Wishlist** | Guest's saved list of rooms they are interested in |
| **VNPay Sandbox** | VNPay test environment; no real money |
| **PENDING** | Booking created, payment not yet completed |
| **CONFIRMED** | Booking with successful payment |
| **CANCELLED** | Booking cancelled by guest, staff, or system (timeout) |
| **IPN** | Instant Payment Notification — server-to-server webhook from VNPay |