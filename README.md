# ArticleDesk

**Article Review Workspace**

ArticleDesk is a collaborative workspace for researchers to import, organize, and screen research articles for systematic literature reviews. Built as part of the EasySLR engineering take-home assignment.

---

## Live Demo

**Live URL:** [https://article-review-workspace-zeta.vercel.app/](https://article-review-workspace-zeta.vercel.app/)

> Deployment to AWS was attempted but not completed within the assignment window due to SST configuration issues with CloudFront and SSM Parameter Store. The Vercel deployment is live.
 

**Demo credentials:**

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@articledesk.dev` | `password123` |
| Reviewer | `reviewer@articledesk.dev` | `password123` |

---

## Setup

### Prerequisites

- Node.js 20+
- A PostgreSQL database (Supabase free tier works fine)

### Steps

**1. Clone and install**

```bash
git clone <repo-url>
cd articledesk
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | NextAuth secret — generate with `npx auth secret` |
| `DATABASE_URL` | Postgres connection string (transaction pooler, port 6543 for Supabase) |
| `DIRECT_URL` | Direct connection string (port 5432) — used by Prisma for migrations |

**3. Run migrations and seed**

```bash
npx prisma migrate dev
npm run db:seed
```

**4. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the demo credentials above.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI primitives) |
| ORM | Prisma + PostgreSQL (Supabase) |
| Auth | NextAuth v5 (Auth.js) — Credentials provider + JWT sessions |
| API | tRPC v11 with end-to-end type safety |
| Table | TanStack Table v8 |
| Excel parsing | ExcelJS |
| Testing | Vitest |

---

## Architecture

### Domain Model

```
Organization
  └── OrganizationMember (User × OrgRole)
  └── Project
        └── ProjectMember (User × ProjectRole)
        └── Article
              └── ArticleReview (per reviewer)
```

A key modeling decision: `ArticleReview` is a **separate table**, not a status column on `Article`. This supports multi-reviewer workflows where each reviewer maintains their own independent screening decision and note on the same article. It also allows the import pipeline to automatically create a `PENDING` review record for every project member when articles are imported, so the table is always populated rather than relying on nullable joins.

### Authorization (ReBAC-style)

Roles are scoped to resources, not global. An org OWNER is not automatically a project OWNER — they need to be explicitly added to the project.

| Action | Org OWNER | Org MEMBER | Project OWNER | Project REVIEWER |
|--------|:---------:|:----------:|:-------------:|:----------------:|
| Create project | ✅ | ❌ | — | — |
| Invite org member | ✅ | ❌ | — | — |
| Import articles | — | — | ✅ | ❌ |
| View articles | — | — | ✅ | ✅ |
| Submit/update review | — | — | ✅ | ✅ |
| Delete article | — | — | ✅ | ❌ |
| Invite project member | — | — | ✅ | ❌ |

Authorization is enforced server-side through a tRPC middleware chain:

```
publicProcedure
  └── protectedProcedure          (requires valid JWT session)
        └── projectMemberProcedure  (requires ProjectMember row)
              └── projectOwnerProcedure  (requires role = OWNER)
```

An earlier bug where reviewers could see projects they weren't members of was fixed by adding a `members: { some: { userId } }` filter to the `listByOrg` query — org membership alone is not sufficient to see a project.

### Import Pipeline

Articles are imported from PubMed-style `.xlsx` exports. The flow has two steps:

**1. Parse + Preview (`parsePreview` mutation)**

The server parses the uploaded file (sent as base64), validates each row, and returns a categorized preview — without writing anything to the database. The client shows only problematic rows (warnings and errors) to keep the preview focused, not the full list of valid rows.

Row categories:
- **Valid** — no issues, will import
- **Warning** — missing optional fields (DOI, year, title without PMID) — importable, user chooses
- **Error** — missing both title and PMID — skipped regardless
- **Duplicate** — matches an existing article by dedup hash — skipped

Deduplication uses an MD5 hash of `normalize(pmid) + normalize(doi)`. Case and whitespace are normalized before hashing.

One subtle PubMed-specific detail: author names are separated by semicolons (`;`), not commas. The validator accepts both but does not warn on semicolon-separated lists.

**2. Confirm + Import (`confirmImport` mutation)**

The user chooses whether to import valid rows only, or valid + warnings. The client sends the chosen rows back to the server, which writes them to the database and creates `ArticleReview` records for all current project members.

**Known weakness:** The client sends parsed rows back in the confirm step, which creates a window between parse and confirm where row data could theoretically be tampered with. A more robust approach would store the parsed rows server-side (in Redis or a staging table) and reference them by a session token at confirm time. The current approach is simpler and acceptable for the assignment scope, but would need to change before production.

### Review Workflow

The review workflow supports four statuses per article per reviewer: `PENDING`, `INCLUDED`, `EXCLUDED`, `MAYBE`. These were chosen to match the language researchers actually use in systematic review screening — include/exclude is the core decision, maybe handles borderline cases, and pending is the default.

Each reviewer's decision is stored independently in `ArticleReview`. The article table shows each user their own current status and note, so two reviewers can screen the same project simultaneously without interfering.

Additional workflow features:
- **Inline note editing** — a popover on each row lets reviewers add a note alongside their status
- **Bulk status update** — select multiple rows and apply a status in one action
- **CSV export** — exports the current filtered view as a CSV with all review metadata

### Pagination

The article table uses cursor-based pagination with a back-navigation stack. Each time the user pages forward, the current cursor is pushed onto a stack; clicking "Previous" pops from the stack to restore the previous page. Changing any filter or sort resets the stack.

---

## Review Workflow Design

The assignment left the review workflow intentionally open-ended. Here is the rationale for the choices made:

**Why Include/Exclude/Maybe?** SLR screening is a binary decision (in or out), but researchers frequently need a holding state for articles that require a second read or consensus discussion. `MAYBE` serves that role without adding complexity like custom labels or saved views.

**Why per-reviewer decisions?** Production SLR tools require inter-rater reliability checks — two reviewers screen independently, then discrepancies are resolved. Storing reviews per reviewer rather than per article makes that pattern possible without a schema migration later.

**Why a status dropdown rather than buttons?** A dropdown keeps the table compact when there are hundreds of articles. Bulk actions handle the common case of applying the same decision to many rows at once.

---

## Import Validation Choices

| Condition | Severity | Reasoning |
|-----------|----------|-----------|
| Missing both Title and PMID | Error (skip row) | No way to identify the article |
| Missing Title (PMID exists) | Warning (importable) | PMID alone is a valid identifier |
| Missing PMID (Title exists) | Warning (importable) | Common for non-PubMed sources |
| Missing DOI | Warning (importable) | DOI is useful but not always present |
| Missing or non-numeric year | Warning (importable) | Year is useful for filtering but not critical |
| Year more than 1 year in the future | Warning (importable) | Likely a data entry error |
| Duplicate (by PMID+DOI hash) | Skipped silently | Not an error, just already imported |

The preview shows only problematic rows (warnings, errors, duplicates). Valid rows are counted in the summary line but not listed individually — showing 500 valid rows would bury the 3 rows the user actually needs to review.

---

## Tests

```bash
npm test
```

Tests cover the behaviors most likely to have subtle bugs or to regress:

- **`import-parser.test.ts`** — row-level validation: missing fields, future years, DOI normalization, semicolon-separated authors, duplicate detection
- **`project-access.test.ts`** — authorization middleware: member/non-member access, reviewer vs. owner distinction  
- **`project.test.ts`** — that `listByOrg` filters by `ProjectMember`, not just `OrganizationMember`
- **`review.test.ts`** — upsert behavior: creates on first call, updates on second, maintains per-reviewer uniqueness

---

## Tradeoffs and Known Gaps

**What works well:**
- Authorization is enforced at the procedure level, not just in UI conditionals
- The import preview is focused on problems rather than showing the full file
- Per-reviewer article reviews support multi-user workflows without a schema change
- Cursor pagination handles large article sets without offset performance degradation

**Known gaps and what I'd address next:**
- **`confirmImport` trust boundary** — as noted above, the server should store parsed rows and confirm by token rather than accepting the client's rows verbatim
- **No AWS deployment** — SST setup with CloudFront and SSM Parameter Store ran into issues I couldn't resolve in the available time. The app is fully deployable on Vercel
- **No optimistic updates** — status changes wait for the server round-trip before updating the UI. For a table with many rows this is noticeable; `onMutate` optimistic updates would fix it
- **No inter-rater view** — there's no way to see another reviewer's decisions or compare them, which would be essential for real SLR consensus workflows
- **No invite emails** — inviting a member requires the user to already exist in the database. A real flow would send an email invitation

---

## Deployment

The app targets Vercel for deployment. `NEXTAUTH_URL` is intentionally omitted from `env.js` because NextAuth v5 auto-infers the URL in serverless environments.

For AWS/SST deployment, the intended approach was:
- SST Ion with a Next.js component
- RDS Postgres or Supabase for the database
- Secrets via SSM Parameter Store
- CloudFront for CDN

This was attempted but not completed. The Vercel deployment is fully functional.

---

## AI Usage

AI assistance was used throughout this project via Cursor (Claude Sonnet). Here is an honest breakdown:

**What AI helped with:**
- Scaffolding boilerplate (tRPC router structure, Prisma schema shape, NextAuth config)
- Drafting initial versions of the import parser and dedup logic
- shadcn/ui component wiring (dialog, popover, table patterns)
- Writing test skeletons for the import validator

**What I personally drove and verified:**
- The authorization model — specifically the decision to use resource-scoped roles rather than global roles, and the middleware chain (`protectedProcedure → projectMemberProcedure → projectOwnerProcedure`). I caught an early bug where `listByOrg` was returning all projects in an org rather than only projects the user was a member of, and fixed the Prisma query to add the `members: { some: { userId } }` filter.
- The `ArticleReview` as a separate table rather than a field on `Article` — AI's first suggestion was a `status` column on `Article`, which I rejected because it doesn't support multi-reviewer workflows.
- The two-step import flow (parse → preview → confirm) and the decision to show only problematic rows in the preview rather than the full file.
- The cursor-stack pagination approach for back-navigation.
- The dedup hash strategy (normalize + MD5 of PMID+DOI).

**One example where I changed AI output:**
The AI initially generated the `confirmImport` handler to re-parse the Excel file on confirmation rather than accepting rows from the client. While re-parsing is actually more secure, it required storing the file server-side between steps. I changed the approach to accept parsed rows from the client (simpler, no server-side storage), but in doing so I recognized and documented the trust boundary issue this introduces — it's a conscious tradeoff, not an oversight.

---

## Time Spent

Approximately 14–16 hours over the assignment window, broken down roughly as:

- Schema design and auth setup: ~2 hours
- Import pipeline (parser, preview, confirm): ~4 hours
- Article table (TanStack Table, pagination, filters, bulk actions): ~3 hours
- Project/org management UI: ~2 hours
- Tests: ~1.5 hours
- Deployment attempts (Vercel + AWS): ~2 hours
- README and cleanup: ~1 hour

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build (runs `prisma migrate deploy` first) |
| `npm run db:seed` | Seed database with demo org, project, and users |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Run Vitest test suite |
| `npm run typecheck` | TypeScript check without emit |

---

## Navigation

```
/ → /login
/login → /orgs
/orgs → /orgs/[orgId]
/orgs/[orgId] → /orgs/[orgId]/projects, /orgs/[orgId]/members
/orgs/[orgId]/projects → /projects/[projectId]
/projects/[projectId] → article table + import dialog
/projects/[projectId]/settings → project member management
```