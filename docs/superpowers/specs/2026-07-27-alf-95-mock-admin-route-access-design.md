# ALF-95 Mock Admin Route Access Design

## Problem

The frontend-only admin journey is mocked, but `proxy.ts` currently sends unauthenticated `/admin` and `/admin/login` requests through `/api/auth/guest`. Guest authorization creates a database user. With PostgreSQL unavailable, both rendered desktop and mobile requests return HTTP 500 before the admin UI can load.

## Decision

Treat the complete `/admin` namespace as a public frontend mock boundary until real admin authentication is implemented. Keep employee application and API authentication behavior unchanged.

This is intentionally temporary and narrow: no session, role, backend login, database fallback, or real authorization is introduced.

## Behavior

- `/admin`
- `/admin/login`
- `/admin/documents/:slug`
- `/admin/documents/upload`

These routes continue directly through the proxy without token lookup or guest creation.

Existing public employee routes (`/`, `/chat/:id`, `/documents/:slug`) stay public. `/login`, `/register`, and protected API routes retain current authentication behavior.

## Verification

- Unit regression test asserts public mock-admin and existing protected-route policy.
- TypeScript and scoped Ultracite pass.
- Rendered desktop/mobile requests to `/admin` return HTTP 200 without PostgreSQL.
- Direct Next production build passes.

## Scope ceiling

Real admin authentication/authorization must replace this bypass in its owning backend-security issue. No UI polish belongs in ALF-95.
