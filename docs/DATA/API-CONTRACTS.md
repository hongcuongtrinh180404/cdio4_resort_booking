# API Contract Document — DTUVIVI

> **Backend:** NestJS
> **Base URL:** `/api` (e.g. `http://localhost:4000/api`)
> **Content-Type:** `application/json`
> **Auth:** JWT Bearer Token — `Authorization: Bearer <token>`
> **Version:** MVP

---

## Conventions

### Response envelope

All endpoints return a consistent shape:

```json
// Success
{ "data": { ... } }

// Success — list
{ "data": [...], "total": 10, "page": 1, "limit": 20 }

// Error (NestJS default exception filter)
{ "statusCode": 400, "message": "Room not available", "error": "Bad Request" }
```

### Auth notation

| Notation | Meaning |
|----------|---------|
| `Public` | No token required |
| `GUEST+` | Any authenticated user |
| `EMPLOYEE+` | EMPLOYEE or ADMIN |
| `ADMIN` | ADMIN only |

### Date format

All dates are **ISO 8601 strings**: `"2026-08-20"` for date-only, `"2026-08-20T14:00:00.000Z"` for datetime.

---

## Table of Contents

1. [Auth](#1-auth)
2. [Users](#2-users)
3. [Rooms](#3-rooms)
4. [Room Types](#4-room-types)
5. [Services](#5-services)
6. [Service Combos](#6-service-combos)
7. [Vouchers](#7-vouchers)
8. [Bookings](#8-bookings)
9. [Payments](#9-payments)
10. [Wishlist](#10-wishlist)
11. [Admin — Users](#11-admin--users)
12. [Admin — Rooms](#12-admin--rooms)
13. [Admin — Room Types](#13-admin--room-types)
14. [Admin — Services](#14-admin--services)
15. [Admin — Service Combos](#15-admin--service-combos)
16. [Admin — Vouchers](#16-admin--vouchers)
17. [Admin — Bookings](#17-admin--bookings)
18. [Admin — Reports](#18-admin--reports)
19. [Error Reference](#19-error-reference)

---

## 1. Auth

### POST `/auth/register`

**Auth:** Public

**Request:**
```json
{
  "email": "guest@example.com",
  "password": "Password123",
  "fullName": "Nguyen Van A"
}
```

**Response `201`:**
```json
{
  "data": {
    "id": 1,
    "email": "guest@example.com",
    "fullName": "Nguyen Van A",
    "role": "GUEST"
  }
}
```

**Errors:**
- `409` — email already exists

---

### POST `/auth/login`

**Auth:** Public

**Request:**
```json
{
  "email": "guest@example.com",
  "password": "Password123"
}
```

**Response `200`:**
```json
{
  "data": {
    "accessToken": "eyJhbGci...",
    "user": {
      "id": 1,
      "email": "guest@example.com",
      "fullName": "Nguyen Van A",
      "role": "GUEST"
    }
  }
}
```

**Errors:**
- `401` — invalid credentials

---

### POST `/auth/forgot-password`

**Auth:** Public

**Request:**
```json
{
  "email": "guest@example.com"
}
```

**Response `200`:**
```json
{
  "data": {
    "message": "Password reset email sent if the account exists"
  }
}
```

> Always returns 200 regardless of whether the email exists — prevents account enumeration.

---

### POST `/auth/reset-password`

**Auth:** Public

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123"
}
```

**Response `200`:**
```json
{
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Errors:**
- `400` — token invalid or expired (token expires after 1 hour)

---

## 2. Users

### GET `/users/me`

**Auth:** `GUEST+`

**Response `200`:**
```json
{
  "data": {
    "id": 1,
    "email": "guest@example.com",
    "fullName": "Nguyen Van A",
    "phone": "0901234567",
    "address": "Da Nang",
    "role": "GUEST",
    "createdAt": "2026-01-15T08:00:00.000Z"
  }
}
```

---

### PATCH `/users/me`

**Auth:** `GUEST+`

**Request** (all fields optional):
```json
{
  "fullName": "Nguyen Van B",
  "phone": "0901234567",
  "address": "Ho Chi Minh City"
}
```

**Response `200`:**
```json
{
  "data": {
    "id": 1,
    "email": "guest@example.com",
    "fullName": "Nguyen Van B",
    "phone": "0901234567",
    "address": "Ho Chi Minh City",
    "role": "GUEST"
  }
}
```

---

## 3. Rooms

### GET `/rooms`

**Auth:** Public

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `checkInDate` | `string` | No | Filter available rooms — format `YYYY-MM-DD` |
| `checkOutDate` | `string` | No | Must be used together with `checkInDate` |
| `capacity` | `number` | No | Minimum guest capacity |
| `roomTypeId` | `number` | No | Filter by room type |
| `page` | `number` | No | Default: `1` |
| `limit` | `number` | No | Default: `10`, max: `50` |

> When `checkInDate` and `checkOutDate` are provided, only rooms with no overlapping `PENDING`, `CONFIRMED`, or `CHECKED_IN` bookings are returned.

**Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "roomNumber": "101",
      "name": "Ocean View Villa",
      "roomType": {
        "id": 2,
        "name": "Villa"
      },
      "capacity": 2,
      "pricePerNight": 3500000,
      "status": "AVAILABLE",
      "images": [
        { "id": 1, "imageUrl": "https://...", "sortOrder": 0 },
        { "id": 2, "imageUrl": "https://...", "sortOrder": 1 }
      ]
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 10
}
```

---

### GET `/rooms/:id`

**Auth:** Public

**Response `200`:**
```json
{
  "data": {
    "id": 1,
    "roomNumber": "101",
    "name": "Ocean View Villa",
    "roomType": {
      "id": 2,
      "name": "Villa",
      "description": "Private villa with ocean view"
    },
    "description": "Spacious villa with private pool facing the ocean.",
    "capacity": 2,
    "pricePerNight": 3500000,
    "status": "AVAILABLE",
    "images": [
      { "id": 1, "imageUrl": "https://...", "sortOrder": 0 },
      { "id": 2, "imageUrl": "https://...", "sortOrder": 1 }
    ]
  }
}
```

**Errors:**
- `404` — room not found

---

## 4. Room Types

### GET `/room-types`

**Auth:** Public

**Response `200`:**
```json
{
  "data": [
    { "id": 1, "name": "Deluxe", "description": "Standard deluxe room" },
    { "id": 2, "name": "Villa", "description": "Private villa" }
  ]
}
```

---

## 5. Services

### GET `/services`

**Auth:** Public

> Returns only active services (`isActive = true`).

**Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Breakfast",
      "description": "Daily breakfast for 2 guests",
      "price": 250000
    },
    {
      "id": 2,
      "name": "Airport Transfer",
      "description": "Round-trip airport pickup",
      "price": 500000
    }
  ]
}
```

---

## 6. Service Combos

### GET `/service-combos`

**Auth:** Public

> Returns only active combos (`isActive = true`).

**Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Honeymoon Package",
      "description": "Romantic package for couples",
      "comboPrice": 1500000,
      "services": [
        { "id": 3, "name": "Massage Couple", "price": 900000 },
        { "id": 4, "name": "Romantic Beach Dinner", "price": 800000 }
      ]
    }
  ]
}
```

---

### GET `/service-combos/:id`

**Auth:** Public

**Response `200`:** Same shape as a single item from the list above.

**Errors:**
- `404` — combo not found

---

## 7. Vouchers

### POST `/vouchers/validate`

**Auth:** `GUEST+`

**Request:**
```json
{
  "code": "SUMMER2026"
}
```

**Response `200`:**
```json
{
  "data": {
    "id": 5,
    "code": "SUMMER2026",
    "description": "Summer discount 2026",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "isValid": true
  }
}
```

> `discountValue` is a raw value — frontend computes the actual discount:
> - `PERCENTAGE`: `discountAmount = totalAmount × (discountValue / 100)`
> - `FIXED_AMOUNT`: `discountAmount = discountValue`

**Errors:**
- `404` — voucher code not found
- `400` — voucher is expired, inactive, or usage limit reached (use `message` field to show reason to user)

---

## 8. Bookings

### POST `/bookings`

**Auth:** `GUEST+`

**Request:**
```json
{
  "roomId": 1,
  "checkInDate": "2026-08-20",
  "checkOutDate": "2026-08-25",
  "services": [
    { "serviceId": 1, "quantity": 5 },
    { "serviceId": 2, "quantity": 1 }
  ],
  "combos": [
    { "comboId": 1, "quantity": 2 }
  ],
  "voucherCode": "SUMMER2026"
}
```

> `services`, `combos`, and `voucherCode` are all optional.

**Response `201`:**
```json
{
  "data": {
    "id": 10,
    "bookingCode": "BK202600010",
    "status": "PENDING",
    "checkInDate": "2026-08-20",
    "checkOutDate": "2026-08-25",
    "numberOfNights": 5,
    "roomPricePerNight": 3500000,
    "serviceTotal": 1750000,
    "comboTotal": 3000000,
    "discountAmount": 825000,
    "totalAmount": 7425000,
    "expiresAt": "2026-08-01T09:30:00.000Z"
  }
}
```

**Errors:**
- `400` — `checkOutDate` must be after `checkInDate`
- `400` — voucher invalid or expired
- `409` — room is not available for the selected dates

---

### GET `/bookings/my`

**Auth:** `GUEST+`

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | `string` | Filter by status: `PENDING` `CONFIRMED` `CHECKED_IN` `CHECKED_OUT` `CANCELLED` |
| `page` | `number` | Default: `1` |
| `limit` | `number` | Default: `10` |

**Response `200`:**
```json
{
  "data": [
    {
      "id": 10,
      "bookingCode": "BK202600010",
      "status": "CONFIRMED",
      "checkInDate": "2026-08-20",
      "checkOutDate": "2026-08-25",
      "totalAmount": 7425000,
      "room": {
        "id": 1,
        "name": "Ocean View Villa",
        "images": [{ "imageUrl": "https://...", "sortOrder": 0 }]
      },
      "createdAt": "2026-08-01T09:00:00.000Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10
}
```

---

### GET `/bookings/:id`

**Auth:** `GUEST+`

> GUEST can only access their own bookings. Returns `403` if the booking belongs to another user.

**Response `200`:**
```json
{
  "data": {
    "id": 10,
    "bookingCode": "BK202600010",
    "status": "CONFIRMED",
    "checkInDate": "2026-08-20",
    "checkOutDate": "2026-08-25",
    "numberOfNights": 5,
    "roomPricePerNight": 3500000,
    "serviceTotal": 1750000,
    "comboTotal": 3000000,
    "discountAmount": 825000,
    "totalAmount": 7425000,
    "expiresAt": "2026-08-01T09:30:00.000Z",
    "room": {
      "id": 1,
      "roomNumber": "101",
      "name": "Ocean View Villa",
      "images": [{ "imageUrl": "https://...", "sortOrder": 0 }]
    },
    "services": [
      { "serviceId": 1, "name": "Breakfast", "quantity": 5, "priceSnapshot": 250000 }
    ],
    "combos": [
      { "comboId": 1, "name": "Honeymoon Package", "quantity": 2, "comboPriceSnapshot": 1500000 }
    ],
    "voucher": {
      "code": "SUMMER2026",
      "discountType": "PERCENTAGE",
      "discountValue": 10
    },
    "payment": {
      "status": "SUCCESS",
      "amount": 7425000,
      "paidAt": "2026-08-01T09:15:00.000Z"
    },
    "createdAt": "2026-08-01T09:00:00.000Z"
  }
}
```

**Errors:**
- `403` — booking does not belong to the current user
- `404` — booking not found

---

### PATCH `/bookings/:id/cancel`

**Auth:** `GUEST+`

> GUEST can only cancel their own bookings. Allowed from `PENDING` or `CONFIRMED` status.

**Request:** No body required.

**Response `200`:**
```json
{
  "data": {
    "id": 10,
    "bookingCode": "BK202600010",
    "status": "CANCELLED"
  }
}
```

**Errors:**
- `403` — booking does not belong to the current user
- `404` — booking not found
- `400` — booking cannot be cancelled from current status (e.g. already `CHECKED_IN`)

---

## 9. Payments

### POST `/payments/create-url`

**Auth:** `GUEST+`

**Request:**
```json
{
  "bookingId": 10
}
```

**Response `201`:**
```json
{
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=742500000&vnp_TxnRef=..."
  }
}
```

**Errors:**
- `403` — booking does not belong to the current user
- `404` — booking not found
- `400` — booking is not in `PENDING` status

---

### POST `/payments/vnpay-ipn`

**Auth:** Public (called by VNPay server)

> **Server-to-server only.** Never called by the frontend.
> This is the **only trusted source** for confirming a booking.
> Always verify HMAC-SHA512 signature before processing.

**Query parameters** (sent by VNPay as query string):

| Param | Description |
|-------|-------------|
| `vnp_TxnRef` | Transaction reference — maps to `Payment.transactionRef` |
| `vnp_ResponseCode` | `"00"` = success, others = failure |
| `vnp_Amount` | Amount in VND × 100 |
| `vnp_SecureHash` | HMAC-SHA512 signature to verify |
| *(others)* | Standard VNPay IPN params |

**Response `200`** (must always return this shape to VNPay):
```json
{ "RspCode": "00", "Message": "Confirm Success" }
```

> Return `{ "RspCode": "00" }` even when the transaction was already processed (idempotent). Return `{ "RspCode": "97" }` only on invalid signature.

---

### GET `/payments/vnpay-return`

**Auth:** Public (browser redirect from VNPay)

> **UI display only.** Do not use this endpoint to update booking status.
> Frontend reads query params to show the payment result to the guest.

**Query parameters** (sent by VNPay):

| Param | Description |
|-------|-------------|
| `vnp_ResponseCode` | `"00"` = success |
| `vnp_TxnRef` | Transaction reference |
| `vnp_Amount` | Amount paid |

**Response `200`:**
```json
{
  "data": {
    "success": true,
    "bookingCode": "BK202600010",
    "amount": 7425000
  }
}
```

---

### GET `/payments/:bookingId`

**Auth:** `GUEST+`

> GUEST can only view payment for their own bookings.

**Response `200`:**
```json
{
  "data": {
    "id": 7,
    "bookingId": 10,
    "amount": 7425000,
    "gateway": "VNPAY",
    "status": "SUCCESS",
    "paidAt": "2026-08-01T09:15:00.000Z",
    "createdAt": "2026-08-01T09:00:00.000Z"
  }
}
```

**Errors:**
- `403` — booking does not belong to current user
- `404` — payment not found

---

## 10. Wishlist

### GET `/wishlist`

**Auth:** `GUEST+`

**Response `200`:**
```json
{
  "data": [
    {
      "id": 3,
      "room": {
        "id": 1,
        "name": "Ocean View Villa",
        "pricePerNight": 3500000,
        "capacity": 2,
        "images": [{ "imageUrl": "https://...", "sortOrder": 0 }]
      },
      "createdAt": "2026-07-10T10:00:00.000Z"
    }
  ]
}
```

---

### POST `/wishlist/:roomId`

**Auth:** `GUEST+`

**Response `201`:**
```json
{
  "data": {
    "id": 3,
    "roomId": 1,
    "userId": 1
  }
}
```

**Errors:**
- `404` — room not found
- `409` — room already in wishlist

---

### DELETE `/wishlist/:roomId`

**Auth:** `GUEST+`

**Response `200`:**
```json
{
  "data": { "message": "Removed from wishlist" }
}
```

**Errors:**
- `404` — item not found in wishlist

---

## 11. Admin — Users

### GET `/admin/users`

**Auth:** `ADMIN`

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `role` | `string` | Filter: `GUEST` `EMPLOYEE` `ADMIN` |
| `page` | `number` | Default: `1` |
| `limit` | `number` | Default: `20` |

**Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "email": "guest@example.com",
      "fullName": "Nguyen Van A",
      "phone": "0901234567",
      "role": "GUEST",
      "createdAt": "2026-01-15T08:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### GET `/admin/users/:id`

**Auth:** `ADMIN`

**Response `200`:** Same shape as a single user object above.

**Errors:**
- `404` — user not found

---

### PATCH `/admin/users/:id/role`

**Auth:** `ADMIN`

**Request:**
```json
{
  "role": "EMPLOYEE"
}
```

**Response `200`:**
```json
{
  "data": {
    "id": 2,
    "email": "staff@example.com",
    "role": "EMPLOYEE"
  }
}
```

**Errors:**
- `404` — user not found

---

## 12. Admin — Rooms

### POST `/admin/rooms`

**Auth:** `EMPLOYEE+`

**Request:**
```json
{
  "roomNumber": "205",
  "name": "Garden Suite",
  "roomTypeId": 1,
  "description": "Quiet suite with garden view.",
  "capacity": 3,
  "pricePerNight": 2000000,
  "imageUrls": [
    { "imageUrl": "https://cdn.example.com/room-205-1.jpg", "sortOrder": 0 },
    { "imageUrl": "https://cdn.example.com/room-205-2.jpg", "sortOrder": 1 }
  ]
}
```

**Response `201`:**
```json
{
  "data": {
    "id": 5,
    "roomNumber": "205",
    "name": "Garden Suite",
    "roomType": { "id": 1, "name": "Deluxe" },
    "capacity": 3,
    "pricePerNight": 2000000,
    "status": "AVAILABLE",
    "images": [
      { "id": 10, "imageUrl": "https://...", "sortOrder": 0 },
      { "id": 11, "imageUrl": "https://...", "sortOrder": 1 }
    ]
  }
}
```

**Errors:**
- `409` — `roomNumber` already exists
- `404` — `roomTypeId` not found

---

### PATCH `/admin/rooms/:id`

**Auth:** `EMPLOYEE+`

**Request** (all fields optional):
```json
{
  "name": "Garden Suite Deluxe",
  "pricePerNight": 2200000,
  "status": "MAINTENANCE",
  "imageUrls": [
    { "imageUrl": "https://cdn.example.com/new.jpg", "sortOrder": 0 }
  ]
}
```

> Sending `imageUrls` **replaces** the full set of images for that room.

**Response `200`:** Updated room object (same shape as `POST` response).

**Errors:**
- `404` — room not found

---

### DELETE `/admin/rooms/:id`

**Auth:** `ADMIN`

**Response `200`:**
```json
{
  "data": { "message": "Room deleted" }
}
```

**Errors:**
- `404` — room not found
- `400` — room has active bookings (`PENDING`, `CONFIRMED`, or `CHECKED_IN`)

---

## 13. Admin — Room Types

### POST `/admin/room-types`

**Auth:** `EMPLOYEE+`

**Request:**
```json
{
  "name": "Bungalow",
  "description": "Beachfront bungalow"
}
```

**Response `201`:**
```json
{
  "data": { "id": 4, "name": "Bungalow", "description": "Beachfront bungalow" }
}
```

**Errors:**
- `409` — name already exists

---

### PATCH `/admin/room-types/:id`

**Auth:** `EMPLOYEE+`

**Request** (all fields optional):
```json
{
  "name": "Beachfront Bungalow",
  "description": "Updated description"
}
```

**Response `200`:** Updated room type object.

---

### DELETE `/admin/room-types/:id`

**Auth:** `ADMIN`

**Response `200`:**
```json
{
  "data": { "message": "Room type deleted" }
}
```

**Errors:**
- `400` — room type has rooms assigned to it

---

## 14. Admin — Services

### POST `/admin/services`

**Auth:** `EMPLOYEE+`

**Request:**
```json
{
  "name": "Spa Premium",
  "description": "Full body spa treatment",
  "price": 750000
}
```

**Response `201`:**
```json
{
  "data": { "id": 5, "name": "Spa Premium", "price": 750000, "isActive": true }
}
```

**Errors:**
- `409` — name already exists

---

### PATCH `/admin/services/:id`

**Auth:** `EMPLOYEE+`

**Request** (all fields optional):
```json
{
  "price": 800000,
  "isActive": false
}
```

**Response `200`:** Updated service object.

---

### DELETE `/admin/services/:id`

**Auth:** `ADMIN`

**Response `200`:**
```json
{
  "data": { "message": "Service deleted" }
}
```

**Errors:**
- `400` — service is part of an active combo

---

## 15. Admin — Service Combos

### POST `/admin/service-combos`

**Auth:** `EMPLOYEE+`

**Request:**
```json
{
  "name": "Family Package",
  "description": "Activities for families",
  "comboPrice": 2000000,
  "serviceIds": [1, 2, 5]
}
```

**Response `201`:**
```json
{
  "data": {
    "id": 3,
    "name": "Family Package",
    "comboPrice": 2000000,
    "isActive": true,
    "services": [
      { "id": 1, "name": "Breakfast" },
      { "id": 2, "name": "Airport Transfer" },
      { "id": 5, "name": "Spa Premium" }
    ]
  }
}
```

**Errors:**
- `409` — name already exists
- `404` — one or more `serviceIds` not found

---

### PATCH `/admin/service-combos/:id`

**Auth:** `EMPLOYEE+`

**Request** (all fields optional):
```json
{
  "comboPrice": 1800000,
  "isActive": true,
  "serviceIds": [1, 5]
}
```

> Sending `serviceIds` **replaces** the full set of services in the combo.

**Response `200`:** Updated combo object (same shape as `POST` response).

---

### DELETE `/admin/service-combos/:id`

**Auth:** `ADMIN`

**Response `200`:**
```json
{
  "data": { "message": "Service combo deleted" }
}
```

---

## 16. Admin — Vouchers

### POST `/admin/vouchers`

**Auth:** `EMPLOYEE+`

**Request:**
```json
{
  "code": "SUMMER2026",
  "description": "Summer discount 2026",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "maxUsage": 100,
  "startDate": "2026-06-01",
  "endDate": "2026-08-31"
}
```

**Response `201`:**
```json
{
  "data": {
    "id": 5,
    "code": "SUMMER2026",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "maxUsage": 100,
    "usedCount": 0,
    "startDate": "2026-06-01T00:00:00.000Z",
    "endDate": "2026-08-31T23:59:59.000Z",
    "isActive": true
  }
}
```

**Errors:**
- `409` — voucher code already exists

---

### PATCH `/admin/vouchers/:id`

**Auth:** `EMPLOYEE+`

**Request** (all fields optional):
```json
{
  "isActive": false,
  "endDate": "2026-07-31"
}
```

**Response `200`:** Updated voucher object.

---

### DELETE `/admin/vouchers/:id`

**Auth:** `ADMIN`

**Response `200`:**
```json
{
  "data": { "message": "Voucher deleted" }
}
```

---

## 17. Admin — Bookings

### GET `/admin/bookings`

**Auth:** `EMPLOYEE+`

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | `string` | Filter by status |
| `roomId` | `number` | Filter by room |
| `from` | `string` | Check-in date from — `YYYY-MM-DD` |
| `to` | `string` | Check-in date to — `YYYY-MM-DD` |
| `page` | `number` | Default: `1` |
| `limit` | `number` | Default: `20` |

**Response `200`:**
```json
{
  "data": [
    {
      "id": 10,
      "bookingCode": "BK202600010",
      "status": "CONFIRMED",
      "checkInDate": "2026-08-20",
      "checkOutDate": "2026-08-25",
      "totalAmount": 7425000,
      "user": { "id": 1, "fullName": "Nguyen Van A", "email": "guest@example.com" },
      "room": { "id": 1, "roomNumber": "101", "name": "Ocean View Villa" },
      "createdAt": "2026-08-01T09:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### GET `/admin/bookings/:id`

**Auth:** `EMPLOYEE+`

**Response `200`:** Full booking detail — same shape as `GET /bookings/:id` plus user info.

---

### PATCH `/admin/bookings/:id/status`

**Auth:** `EMPLOYEE+`

> Only allowed transitions (see booking lifecycle):
> `CONFIRMED → CHECKED_IN`, `CHECKED_IN → CHECKED_OUT`, `CONFIRMED → CANCELLED`

**Request:**
```json
{
  "status": "CHECKED_IN"
}
```

**Response `200`:**
```json
{
  "data": {
    "id": 10,
    "bookingCode": "BK202600010",
    "status": "CHECKED_IN"
  }
}
```

**Errors:**
- `404` — booking not found
- `400` — transition not allowed from current status

---

## 18. Admin — Reports

### GET `/admin/reports/revenue`

**Auth:** `EMPLOYEE+`

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | `string` | Yes | Start date — `YYYY-MM-DD` |
| `to` | `string` | Yes | End date — `YYYY-MM-DD` |

**Response `200`:**
```json
{
  "data": {
    "from": "2026-01-01",
    "to": "2026-12-31",
    "totalRevenue": 250000000,
    "totalBookings": 120,
    "byStatus": {
      "CONFIRMED": 85,
      "CHECKED_IN": 10,
      "CHECKED_OUT": 20,
      "CANCELLED": 5
    }
  }
}
```

> Only bookings with `CONFIRMED`, `CHECKED_IN`, or `CHECKED_OUT` status are counted toward `totalRevenue`.

---

## 19. Error Reference

### HTTP status codes used

| Code | When |
|------|------|
| `200` | Success |
| `201` | Resource created |
| `400` | Validation error, invalid transition, business rule violation |
| `401` | Missing or invalid JWT token |
| `403` | Authenticated but not authorized (wrong role or wrong owner) |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, roomNumber, voucher code, etc.) |
| `500` | Unexpected server error |

### Error response shape

```json
{
  "statusCode": 409,
  "message": "Room number already exists",
  "error": "Conflict"
}
```

### Common error messages by domain

| Domain | Scenario | Message |
|--------|----------|---------|
| Auth | Wrong email/password | `"Invalid credentials"` |
| Auth | Token expired | `"Unauthorized"` |
| Auth | Email taken | `"Email already exists"` |
| Auth | Reset token expired | `"Reset token is invalid or expired"` |
| Room | Not found | `"Room not found"` |
| Room | Unavailable for dates | `"Room is not available for the selected dates"` |
| Room | Has active bookings (on delete) | `"Cannot delete room with active bookings"` |
| Booking | Not found | `"Booking not found"` |
| Booking | Not owner | `"You do not have access to this booking"` |
| Booking | Invalid cancel | `"Booking cannot be cancelled from current status"` |
| Booking | Invalid transition | `"Status transition not allowed"` |
| Payment | Not PENDING | `"Booking is not awaiting payment"` |
| Payment | Invalid signature | `"Invalid VNPay signature"` |
| Voucher | Not found | `"Voucher code not found"` |
| Voucher | Not valid | `"Voucher is expired, inactive, or usage limit reached"` |