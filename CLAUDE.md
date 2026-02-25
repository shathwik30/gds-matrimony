# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GDS Matrimony ("GDS Marriage Links") — a full-stack matrimonial platform built with Next.js 16, React 19, TypeScript, PostgreSQL (Neon), and Drizzle ORM. Features real-time messaging via Socket.io, Razorpay payments, NextAuth v5 authentication, and UploadThing file uploads.

## Commands

```bash
npm run dev            # Dev server (Node.js + Socket.io wrapper around Next.js)
npm run dev:turbo      # Dev with Turbopack (no Socket.io — no real-time messaging)
npm run build          # Production build
npm start              # Production server (Node.js + Socket.io)
npm run lint           # ESLint (zero warnings enforced)
npm run typecheck      # TypeScript type-check (tsc --noEmit)
npm run format         # Prettier auto-format all files
npm run format:check   # Prettier check (CI use)
npm run validate       # Runs typecheck + lint + format:check

# Database (Drizzle + Neon PostgreSQL)
npm run db:generate    # Generate migrations from schema changes
npm run db:migrate     # Apply migrations
npm run db:push        # Push schema directly (skip migrations)
npm run db:studio      # Open Drizzle Studio GUI
```

No test runner is configured. There are no tests in this project.

## Environment Setup

Local secrets go in `.env.local` (not `.env`). A `.env.example` exists at repo root.

Required: `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `UPLOADTHING_TOKEN`.

Optional (have defaults): `NEXTAUTH_URL`, `FROM_EMAIL`, `SUPPORT_EMAIL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `ADMIN_EMAILS` (comma-separated list).

Public client-side: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_SOCKET_URL` (optional — leave empty for serverless deployments).

Drizzle reads from `.env.local` explicitly via `dotenv.config({ path: ".env.local" })`.

## Pre-commit Hooks

Husky runs on every commit:

1. `lint-staged` — Prettier auto-format + ESLint (`--max-warnings 0`) on staged `*.{ts,tsx}` files; Prettier on `*.{json,css,md,mjs}`
2. `npm run typecheck` — full TypeScript type-check

## Architecture

### Routing & Middleware

Next.js App Router with route groups:

- `(public)/` — Landing, about, contact, pricing, privacy, terms
- `(auth)/` — Login, register, forgot/reset password, verify-email (redirects to `/dashboard` if logged in)
- `(dashboard)/` — Dashboard, matches, interests, messages, profile, settings, membership, activity, contact-packs, shortlist
- `(admin)/` — Admin panel (users, subscriptions, reports, analytics, settings, verifications, contact-submissions)
- `api/` — REST endpoints (auth, payments, messages, uploads, user account changes)

Middleware lives in `src/proxy.ts` (exports NextAuth's `auth()` wrapper). Protected routes redirect unauthenticated users to `/login?callbackUrl=...`.

### Server Actions vs API Routes

- **Server actions** (`src/lib/actions/`) handle most data mutations. Action files: `auth.ts`, `profile.ts`, `interests.ts`, `messages.ts`, `shortlist.ts`, `block-report.ts`, `contact.ts`, `contact-packs.ts`, `subscription.ts`, `admin.ts`, `activity.ts`.
- **API routes** (`src/app/api/`) are used only for: NextAuth handler, Razorpay payment/webhook endpoints, messaging, UploadThing, and user account operations (change-password, delete-account).

### Server Action Patterns

`src/lib/actions/helpers.ts` exports:

- `requireAuth()` — checks session, returns `{ userId }` or `{ error: ActionResult }` (discriminated union). Callers destructure and early-return on error.
- `requireAdmin()` — extends `requireAuth()`, verifies user's email is in `ADMIN_EMAILS` env var.
- `checkBlocked(userId1, userId2)` — queries `blocks` table for either direction.

All actions return `ActionResult<T>` (from `src/types/index.ts`): `{ success: boolean; error?: string; message?: string; data?: T }`.

### Database

Single schema file: `src/lib/db/schema.ts`. Connection in `src/lib/db/index.ts` (Neon serverless pool + Drizzle). Migrations in `./drizzle/`.

Key tables: `users`, `profiles`, `subscriptions`, `payments`, `interests`, `messages`, `conversations`, `partnerPreferences`, `blocks`, `reports`, `otps`, `verifications`, `activityLogs`, `siteSettings`.

All enums (gender, maritalStatus, subscriptionPlan, interestStatus, messageStatus, trustLevel, etc.) are defined as `pgEnum` in the schema file.

### Real-time (Socket.io)

`server.js` wraps Next.js with a Node HTTP server + Socket.io on path `/api/socketio/`. Auth via JWT token (HS256 against `AUTH_SECRET`) in handshake + live DB user check. Users join `user:${userId}` rooms. Per-event rate limiting in memory (e.g., `typing`: 10/10s, `new_message`: 20/min). `global.io` is set so server actions can emit events directly. `dev:turbo` does NOT run `server.js`, so real-time messaging is unavailable in Turbopack mode.

### Authentication

NextAuth v5 with Credentials provider (`src/lib/auth.ts`). JWT strategy (14-day expiry). Session token includes `id`, `profileCompleted`, `subscriptionPlan`. JWT is refreshed from DB every 5 minutes to keep subscription/profile data current. Profile completion threshold: 70% → `profileCompleted: true`. Brute force protection: 5 failed attempts → 15-minute lock. OTP verification: 10-min expiry, 60s resend cooldown, 5 max attempts.

### Payments

Razorpay integration (`src/lib/razorpay.ts`). Subscription plans: free, basic, silver, gold, platinum. Contact packs: 10/25/50 units. 18% GST applied. Webhook + client-side verification flow.

### UI

Shadcn/ui components in `src/components/ui/`. Feature components organized by domain: `admin/`, `dashboard/`, `matching/`, `profile/`. Layout components: `layout/` (Header, Footer, DashboardSidebar, BottomNavigation). Also: `accessibility/`, `animations/`, `seo/`. Styling with Tailwind CSS v4. Animations via Framer Motion. State management with React Query (no Zustand).

React Query defaults (in `src/components/providers.tsx`): 60s `staleTime`, `refetchOnWindowFocus: false`. Toast notifications via Sonner (top-center, 4s duration, max 3).

### Validations

Zod schemas in `src/lib/validations/` mirror the database schema for form validation. Used with `react-hook-form` via `@hookform/resolvers`.

### Constants

`src/constants/index.ts` contains all domain data: religions with caste mappings, Indian states/cities, height ranges, education degrees, income brackets, occupation types, subscription plan details, compatibility scoring weights.

### Utilities

`src/lib/utils/` is split into submodules re-exported via `src/lib/utils.ts`:

- Main (`index.ts`): `cn()`, date formatting, height conversion, `formatCurrency()` (INR), `calculateProfileCompletion()`, `getMissingProfileFields()`, `parseAdminEmails()`, `parseUserId()`
- `server.ts`: Server-only (`import "server-only"`). `generateOTP()`, `generateId()`
- `compatibility.ts`: `calculateCompatibilityScore()` — 15-criteria weighted scoring
- `image.ts`: `convertToWebP()` — browser-side canvas conversion
- `subscription.ts`: `isUnlimited()`, `isFreeUser()`

## Key Files

- `src/proxy.ts` — Middleware (route protection)
- `src/lib/auth.ts` — NextAuth config
- `src/lib/db/schema.ts` — Complete database schema
- `src/lib/db/index.ts` — DB connection
- `src/lib/env.ts` — Environment variable validation (Zod)
- `src/lib/email.ts` — Resend email templates
- `src/lib/actions/helpers.ts` — `requireAuth()`, `requireAdmin()`, `checkBlocked()`
- `src/types/index.ts` — Shared TypeScript types (`ActionResult<T>`, `MatchProfile`, `SessionUser`, etc.)
- `server.js` — Socket.io + Node.js server wrapper
- `src/components/providers.tsx` — SessionProvider, QueryClientProvider, Toaster
- `src/constants/index.ts` — All domain constants

## Code Style

- TypeScript strict mode. Path alias: `@/*` → `src/*`.
- Prettier: 100-char width, double quotes, 2-space indent, `es5` trailing commas, `prettier-plugin-tailwindcss` for class sorting.
- ESLint flat config extending `next/core-web-vitals`, `next/typescript`, and `prettier`.
- Fonts: Inter (body) and Playfair Display (headings), loaded via `next/font/google`.
- Locale: `en-IN` (Indian English). Currency: INR.
