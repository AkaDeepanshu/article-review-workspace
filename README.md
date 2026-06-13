# ArticleDesk

ArticleDesk is a collaborative workspace for researchers to import, organize, and screen research articles for systematic literature reviews.

**Tagline:** Systematic literature review, simplified.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Prisma ORM** + PostgreSQL (Supabase)
- **NextAuth/Auth.js** for authentication (Credentials provider)
- **tRPC** for end-to-end typesafe API
- **TanStack Table** for the article review table
- **Vitest** for tests

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Configure `.env`:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | NextAuth secret (`npx auth secret`) |
| `DATABASE_URL` | Supabase transaction pooler URL (port 6543) |
| `DIRECT_URL` | Supabase direct/session URL (port 5432) for migrations |
| `AUTH_DISCORD_ID` | Optional Discord OAuth |
| `AUTH_DISCORD_SECRET` | Optional Discord OAuth |

4. Run migrations and seed:

```bash
npx prisma migrate dev
npm run db:seed
```

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@articledesk.dev` | `password123` |
| Reviewer | `reviewer@articledesk.dev` | `password123` |

## Architecture

### Authorization (ReBAC)

Roles are scoped to resources, not global:

| Action | Org OWNER | Org MEMBER | Project OWNER | Project REVIEWER |
|--------|-----------|------------|---------------|------------------|
| Create project | ✅ | ❌ | — | — |
| Import articles | — | — | ✅ | ❌ |
| View articles | — | — | ✅ | ✅ |
| Submit review | — | — | ✅ | ✅ |
| Delete article | — | — | ✅ | ❌ |

tRPC middleware chain:

```
protectedProcedure → projectMemberProcedure → projectOwnerProcedure
```

### Domain Model

```
Organization → Project → Article → ArticleReview (per reviewer)
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Run Vitest tests |

## Navigation

```
Login → Organizations → Org Dashboard → Project View (Article Table + Import)
```

## Tests

```bash
npm test
```
