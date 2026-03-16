# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is AiroPulse

AI-powered product research tool that mines Reddit complaints and discussions to extract actionable competitive insights. Users upload product documents, then a multi-step AI pipeline identifies competitors, searches Reddit, analyzes threads, and synthesizes a markdown report.

Built by Airodental. The primary research target is **Saige** (AI-powered training/coaching for dental practices). See `docs/saige-summary.md` for product context and `docs/airopulse-vision.md` for philosophy.

## Commands

```bash
npm run dev      # Start dev server (Next.js 16, port 3000)
npm run build    # Production build
npm run lint     # ESLint (v9 flat config)
```

No test framework is configured. Database migrations run via `POST /api/migrate`.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict)
- **Neon PostgreSQL** via `@neondatabase/serverless` — raw parameterized SQL, no ORM
- **OpenAI API** (gpt-4.1, gpt-4.1-mini, gpt-4.1-nano) — model aliases in `src/lib/ai/models.ts`
- **shadcn/ui** (Base Nova preset) + **Tailwind CSS v4** + **Lucide icons**
- **SWR** for client-side data fetching
- **mammoth** / **pdf-parse** for document extraction (dynamically imported, marked as `serverExternalPackages`)

## Environment Variables

Defined in `.env.local` (never committed):
- `OPENAI_API_KEY` — OpenAI authentication
- `DATABASE_URL` — Neon PostgreSQL connection string
- `TAVILY_API_KEY` — Tavily web search (used for competitor research and Reddit thread discovery)

## Architecture

### Path alias
`@/*` maps to `./src/*`

### Data flow (pipeline)

```
Upload Documents → Summarize (gpt-4.1) → Identify Competitors + Queries (gpt-4.1)
  → Mine Reddit (rate-limited API) → Analyze Threads (gpt-4.1-mini) → Synthesize Report (gpt-4.1)
```

Pipeline steps are triggered sequentially via `POST /api/projects/:id/pipeline` with a `step` body param. Each step updates `projects.status` and creates a `pipeline_runs` record tracking tokens/duration.

### Key layers

- **`src/lib/db/`** — Database modules. Each file (projects, documents, competitors, queries, threads, insights, pipeline) exports CRUD functions using parameterized SQL. Connection singleton in `src/lib/db.ts`.
- **`src/lib/ai/`** — LLM modules. `prompts.ts` has system prompts, individual files handle each pipeline step (summarize, competitors, analyze-thread, synthesize). All return structured JSON via OpenAI's response format.
- **`src/lib/reddit/`** — Reddit scraping. `search.ts` searches via Reddit's `.json` endpoints, `fetch-thread.ts` gets full threads, `rate-limiter.ts` enforces 600ms between requests.
- **`src/lib/file-processing/`** — Document text extraction routing by file type. Uses dynamic imports for mammoth/pdf-parse.
- **`src/app/api/`** — REST API routes. All use `errorResponse()` from `src/lib/api-error.ts` for consistent error formatting.
- **`src/components/`** — React client components. `src/components/ui/` contains shadcn primitives.

### Database schema

7 tables with UUID primary keys and cascading deletes. Root entity is `projects`. Key relationships:
- `documents`, `competitors`, `search_queries`, `reddit_threads`, `insights`, `pipeline_runs` all FK to `projects`
- `reddit_threads` also FKs to `search_queries`; `insights` FKs to `reddit_threads`
- `reddit_threads` has a UNIQUE constraint on `(project_id, reddit_id)`
- Thread data stored as JSONB in `reddit_threads.thread_json`

Schema defined as raw SQL in `src/lib/db/migrate.ts`.

### Project status machine

`draft → summarizing → identifying_competitors → mining → analyzing → synthesizing → complete`
Any step can transition to `error` with a message.

## Patterns to Follow

- **Singletons** for DB and OpenAI clients (`getDb()`, `getOpenAI()`)
- **Dynamic imports** for heavy server-only packages (mammoth, pdf-parse)
- **Error handling**: throw `ApiError(message, statusCode, code, details)` in API routes; use `errorResponse(error)` in catch blocks
- **Types**: all domain types and enums live in `src/lib/types.ts`
- **Utility**: `cn()` from `src/lib/utils.ts` for Tailwind class merging
- **Toasts**: use `sonner` (`toast.success()`, `toast.error()`) for user feedback
