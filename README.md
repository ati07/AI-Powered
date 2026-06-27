# AI-Powered Operations Platform

A production-ready **Next.js 15** starter with **Clean Architecture**, **feature-based** folder structure, and a modern full-stack toolchain.

## 🚀 Tech Stack

| Layer              | Technology                                         |
| ------------------ | -------------------------------------------------- |
| **Framework**      | Next.js 15 (App Router)                            |
| **Language**       | TypeScript 5                                       |
| **Styling**        | Tailwind CSS 3 + shadcn/ui                         |
| **Database**       | PostgreSQL + Prisma ORM                            |
| **Auth**           | Clerk                                              |
| **Validation**     | Zod                                                |
| **Linting**        | ESLint 9 (flat config) + Prettier                  |

## 🏗️ Architecture

Follows **Clean Architecture** principles with strict dependency rules:

```
src/
├── domain/            # Enterprise business logic (framework-free)
│   ├── entities/      # Business entities (User, Organization, …)
│   ├── value-objects/ # Value objects (Email, Role, …)
│   └── repositories/  # Repository interfaces
├── application/       # Use cases (depend only on domain)
│   ├── auth/          # Auth use cases
│   ├── user/          # User use cases
│   └── common/        # Shared errors, types
├── infrastructure/    # External implementations
│   ├── db/            # Prisma client + repository implementations
│   ├── auth/          # Clerk client + webhook handler
│   └── config/        # Environment variable validation (Zod)
├── features/          # Feature-based UI modules
│   ├── auth/          # Auth forms, hooks, schemas
│   ├── dashboard/     # Dashboard components, hooks
│   └── users/         # User components, hooks
├── components/        # Shared UI components
│   ├── ui/            # shadcn primitives
│   └── shared/        # App shell, header, sidebar
└── lib/               # Utilities (cn, formatDate, …)
```

**Dependency rule:** Code can only point inward — → application → → domain. Never the reverse.

## ⚡ Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+
- A **Clerk** account (free tier)

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable                              | Description                       |
| ------------------------------------- | --------------------------------- |
| `DATABASE_URL`                        | PostgreSQL connection string      |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`   | Clerk Publishable Key             |
| `CLERK_SECRET_KEY`                    | Clerk Secret Key                  |
| `CLERK_WEBHOOK_SECRET`                | Clerk Webhook Secret (optional)   |

### 3. Database

```bash
# Push the schema to your PostgreSQL database
npx prisma db push

# Or create a migration
npx prisma migrate dev --name init

# (Optional) Seed the database
npm run db:seed

# Launch Prisma Studio to browse data
npm run db:studio
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Clerk Webhook (for user sync)

1. In Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. Endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
4. Copy the **Signing Secret** to `CLERK_WEBHOOK_SECRET` in `.env`

## 📋 Available Scripts

| Script               | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start dev server                   |
| `npm run build`      | Production build                   |
| `npm run start`      | Start production server            |
| `npm run lint`       | Run ESLint                         |
| `npm run format`     | Format code with Prettier          |
| `npm run type-check` | Run TypeScript compiler check      |
| `npm run db:push`    | Push Prisma schema to DB           |
| `npm run db:migrate` | Create and run Prisma migrations   |
| `npm run db:seed`    | Seed the database                  |
| `npm run db:studio`  | Launch Prisma Studio               |

## 🧱 Project Structure

### Creating a new feature

```
src/features/your-feature/
├── components/   # Feature-specific React components
├── hooks/        # Feature-specific React hooks
└── schemas/      # Zod validation schemas
```

### Creating a new domain entity

```
src/domain/entities/your-entity.entity.ts   # Entity class
src/domain/repositories/your.repository.ts  # Repository interface
```

Then implement the repository in `src/infrastructure/db/repositories/`.

## 🛟 Troubleshooting

**Build fails with "Missing publishableKey" for Clerk**
→ Set a real Clerk publishable key in `.env`. Placeholder keys cause Clerk's eager validation to throw.

**Prisma client not found**
→ Run `npx prisma generate` after any schema change.
