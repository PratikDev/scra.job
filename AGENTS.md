# Repository Guidelines

## Project Structure & Module Organization

This is a TanStack Start/Vite React app backed by Convex. `src/routes/` contains file-based routes; `__root.tsx` defines the document shell and Convex provider; `index.tsx` redirects to the dashboard. Shared React components live in `src/components/`, with shadcn/ui primitives in `src/components/ui/`. Client utilities live in `src/lib/`. Convex schema, functions, scrapers, and match scoring logic live in `convex/`. Static browser assets are in `public/`; legacy runtime SQLite data may exist under `data/` for one-time imports. Do not manually edit generated `src/routeTree.gen.ts`.

## Build, Test, and Development Commands

Use Bun for local development.

- `bun install`: install dependencies from `bun.lock`.
- `bun dev`: start Convex dev and the Vite web app together.
- `bun run dev:web`: start only the frontend on port `3000`.
- `bun run convex:dev`: start only Convex dev.
- `bun run convex:once`: run one Convex dev/codegen pass.
- `bun run import:sqlite -- --dry-run`: inspect legacy SQLite import counts.
- `bun run import:sqlite`: import `data/scrajob.sqlite` into Convex.
- `bun build`: create the production build.
- `bun preview`: preview the built frontend locally.
- `bun test`: run Vitest.
- `bunx tsc --noEmit`: type-check without writing output.

## Coding Style & Naming Conventions

Write TypeScript and TSX with strict compiler settings. Use the `@/*` path alias for repo-root imports. Try to avoid `any` or `unknown` types as much as possible. Keep **EVERYTHING** type-safe. Components use PascalCase filenames and exports, for example `BrandSelector.tsx`; hooks use `use-*` naming, for example `use-mobile.ts`; utility modules use short lowercase names such as `score.ts` and `format.ts`. Follow the existing style: TypeScript/TSX in `src`, ESM JavaScript in `server`, tabs, double quotes, and semicolons. Prefer named functions for larger handlers and keep types close to their owning route or component. Use `@/` aliases for imports from `src`. Never make a single file too long. Do code splitting with easily manageable/understandable file structure. always follow DRY strategy for everything. Whether it's a type/interface declaration or even a simple utility function. Never write same logic in multiple places. and keep everything easily extensible. If any css color is needs to be used that isn't available in `globals.css` already, never use tailwind arbitrary values. always declare them as variables in `globals.css` and use those variables in the classnames. For any frontend related task, use shadcn/ui components as much as possible. When asked to move a component's logic to a custom hook, determine if this hook is component-specific or will be reused across multiple components. For component-specific hooks, move the component jsx to it's own directory first and then place the custom hook inside that directory. So `components/Example.tsx` should become `components/Example/index.tsx` and the path for the custom hook should be `components/Example/use-custom-hook.ts`. For reusuable hooks, place it in `hooks/` directory.

## Testing Guidelines

Vitest is configured. Add tests beside covered code using `*.test.ts` or `*.test.tsx`. Use Testing Library for React behavior and plain Vitest assertions for Convex utility modules such as match scoring. Run `bun test` before submitting changes; run `bunx tsc --noEmit` for TypeScript changes.

## Commit & Pull Request Guidelines

Keep commits atomic: commit only the files you touched and list each path explicitly. For tracked files run `git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. For brand-new files, use the one-liner `git restore --staged :/ && git add "path/to/file1" "path/to/file2" && git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. Always check the changed files by `git status` before committing. Never commit files from the thread context. Never change any file content before committing. PRs should explain user-visible impact, list Convex/schema or config changes, and link related issues. Pull requests should include a short summary, validation steps, and linked issues when relevant. Note any schema, environment, or migration impact explicitly.

## Security & Configuration Tips

The frontend reads `VITE_CONVEX_URL`, which is written by Convex dev after project configuration. Do not commit local database contents, secrets, or scraped personal data. Keep network scraper changes conservative and handle source failures without breaking the whole scrape.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
