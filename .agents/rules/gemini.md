---
trigger: always_on
---

# GEMINI.md

## Purpose

This file acts as the entry point for AI assistants working on the DTUVIVU project.

Before generating code, modifying files, or creating new modules, always consult the relevant section in `project-rules.md`.

---

## Rule Routing

### Architecture & Folder Structure

When working with:

* NestJS modules
* Next.js folders
* Project organization
* New feature/module creation

Read:

* `project-rules.md` → Section 1: Project Structure
* `project-rules.md` → Section 2: Backend Rules — NestJS
* `project-rules.md` → Section 3: Frontend Rules — Next.js

---

### Database & Prisma

When working with:

* Prisma schema
* Migrations
* Database design
* Relations
* Query optimization

Read:

* `project-rules.md` → Section 4: Database & Prisma Rules

---

### Authentication & Authorization

When working with:

* JWT
* Guards
* Roles
* User permissions
* RBAC

Read:

* `project-rules.md` → Section 5: Authentication & Authorization

---

### API Development

When creating or modifying:

* Controllers
* DTOs
* Endpoints
* Swagger documentation

Read:

* `project-rules.md` → Section 2: Backend Rules — NestJS
* `project-rules.md` → Section 6: API Design Rules

---

### Payment Integration

When working with:

* VNPay
* Payment processing
* IPN callbacks
* Payment status handling

Read:

* `project-rules.md` → Section 7: VNPay Integration Rules

Critical requirement:

* Booking confirmation MUST happen through VNPay IPN.
* Never confirm bookings using Return URL.

---

### TypeScript Standards

When writing any TypeScript code:

Read:

* `project-rules.md` → Section 8: TypeScript Rules

Important:

* Strict mode enabled
* No `any`
* Prefer interfaces
* Shared enums only

---

### Error Handling

When implementing:

* API errors
* Validation errors
* Frontend error states

Read:

* `project-rules.md` → Section 9: Error Handling

---

### Naming Conventions

Before creating:

* Files
* Classes
* DTOs
* Components
* Hooks
* API paths

Read:

* `project-rules.md` → Section 10: Naming Conventions

---

### Git Workflow

Before:

* Creating branches
* Writing commits
* Opening pull requests

Read:

* `project-rules.md` → Section 11: Git & Collaboration

---

### Environment Configuration

When adding:

* Environment variables
* External services
* Application configuration

Read:

* `project-rules.md` → Section 12: Environment & Config

---

### Forbidden Practices

Before submitting any code changes:

Read:

* `project-rules.md` → Section 13: What NOT To Do

These rules override personal coding preferences.

---

## Development Checklist

Before generating code, verify:

* Correct project structure
* Correct module boundaries
* DTO validation exists
* No business logic in controllers
* No hardcoded URLs
* No `any`
* Prisma transactions used where required
* RBAC enforced server-side
* Naming conventions followed
* Environment variables used correctly

If any generated code violates `project-rules.md`, revise the implementation before returning the final result.
