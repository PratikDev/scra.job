# Scra.job

A TanStack Start remote job scraper and application tracker backed by Convex.

## Local Setup

```bash
bun install
npx convex dev
bun dev
```

On first run, Convex may ask you to choose a team/project. After it writes `VITE_CONVEX_URL`, the frontend runs at:

```txt
http://localhost:3000
```

## Commands

```bash
bun dev                       # Convex dev + Vite
bun run dev:web               # frontend only
bun run convex:dev            # Convex only
bun run convex:once           # one Convex codegen/deploy pass
bun run import:sqlite -- --dry-run
bun run import:sqlite
bun test
bunx tsc --noEmit
bun build
```

## SQLite Import

The one-time importer reads `data/scrajob.sqlite` by default and imports:

- `ScrapedJobs` into `scrapedJobs`
- `TrackedJobs` into `trackedJobs`
- `Profiles` into `profiles`

Use `SQLITE_DB_PATH=/path/to/scrajob.sqlite` to import a different file.

## Architecture

```txt
React frontend -> Convex queries/mutations/actions -> Convex database
                                                   -> public unauthenticated job sources
```
