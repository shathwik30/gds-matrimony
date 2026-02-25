# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GDS Matrimony ("GDS Marriage Links") — a full-stack matrimonial platform built with Next.js 16, React 19, TypeScript, PostgreSQL (Neon), and Drizzle ORM. Features real-time messaging via Socket.io, Razorpay payments, NextAuth v5 authentication, and UploadThing file uploads.

## Commands

```bash
npm run dev            # Dev server (Node.js + Socket.io wrapper around Next.js)
npm run dev:turbo      # Dev with Turbopack (no Socket.io)
npm run build          # Production build
npm start              # Production server (Node.js + Socket.io)
npm run lint           # ESLint

# Database (Drizzle + Neon PostgreSQL)
npm run db:generate    # Generate migrations from schema changes
npm run db:migrate     # Apply migrations
npm run db:push        # Push schema directly (skip migrations)
npm run db:studio      # Open Drizzle Studio GUI
npm run db:seed        # Seed database
npm run db:seed:fresh  # Drop and re-seed
```

## Architecture

### Routing & Middleware

Next.js App Router with route groups:

- `(public)/` — Landing, about, contact pages
- `(auth)/` — Login, register, forgot/reset password (redirects to `/dashboard` if logged in)
- `(dashboard)/` — User dashboard, matches, interests, messages, profile, settings, membership
- `(admin)/` — Admin panel
- `api/` — REST endpoints (auth, payments, messages, uploads)

Middleware lives in `src/proxy.ts` (exports NextAuth's `auth()` wrapper). Protected routes redirect unauthenticated users to `/login?callbackUrl=...`.

### Server Actions vs API Routes

- **Server actions** (`src/lib/actions/`) handle most data mutations: auth flows, profile CRUD, interests, messages, subscriptions, admin ops. Each action file uses a `getAuthenticatedUser()` helper from `actions/helpers.ts`.
- **API routes** (`src/app/api/`) are used only for: NextAuth handler, Razorpay payment/webhook endpoints, messaging, and UploadThing.

### Database

Single schema file: `src/lib/db/schema.ts`. Connection in `src/lib/db/index.ts` (Neon serverless pool + Drizzle).

Key tables: `users`, `profiles`, `subscriptions`, `payments`, `interests`, `messages`, `conversations`, `partnerPreferences`, `blocks`, `reports`, `otps`, `verifications`, `activityLogs`, `siteSettings`.

All enums (gender, maritalStatus, subscriptionPlan, interestStatus, messageStatus, trustLevel, etc.) are defined as `pgEnum` in the schema file.

### Real-time (Socket.io)

`server.js` wraps Next.js with a Node HTTP server + Socket.io. Auth via JWT token in handshake. Users join `user:${userId}` rooms. Events: `typing`, `new_message`, `messages_read`, `conversation_updated`.

### Authentication

NextAuth v5 with Credentials provider (`src/lib/auth.ts`). JWT strategy (30-day expiry). Session token includes `id`, `profileCompleted`, `subscriptionPlan`. Brute force protection: 5 failed attempts → 15-minute lock. OTP verification: 10-min expiry, 60s resend cooldown, 5 max attempts.

### Payments

Razorpay integration (`src/lib/razorpay.ts`). Subscription plans: free, basic, silver, gold, platinum. Contact packs: 10/25/50 units. 18% GST applied. Webhook + client-side verification flow.

### UI

Shadcn/ui components in `src/components/ui/`. Feature components organized by domain: `admin/`, `auth/`, `dashboard/`, `forms/`, `matching/`, `messaging/`, `profile/`, `shared/`. Styling with Tailwind CSS v4. Animations via Framer Motion. State management with Zustand + React Query.

### Validations

Zod schemas in `src/lib/validations/` mirror the database schema for form validation. Used with `react-hook-form` via `@hookform/resolvers`.

### Constants

`src/constants/index.ts` contains all domain data: religions with caste mappings, Indian states/cities, height ranges, education degrees, income brackets, occupation types, subscription plan details, compatibility scoring weights.

## Key Files

- `src/proxy.ts` — Middleware (route protection)
- `src/lib/auth.ts` — NextAuth config
- `src/lib/db/schema.ts` — Complete database schema
- `src/lib/db/index.ts` — DB connection
- `src/lib/env.ts` — Environment variable validation
- `src/lib/email.ts` — Resend email templates
- `src/lib/actions/helpers.ts` — Shared server action utilities
- `server.js` — Socket.io + Node.js server wrapper
- `src/components/providers.tsx` — Client-side context providers

## Path Aliases

`@/*` maps to `src/*` (configured in tsconfig.json and components.json).
