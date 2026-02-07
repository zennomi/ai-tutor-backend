# Task Completion Checklist
- Run `pnpm build` after code changes to typecheck.
- Run relevant tests (`pnpm test`/`pnpm test:e2e`) when affecting logic.
- Lint/format if needed: `pnpm lint`, `pnpm format`.
- Update configs/env samples when adding/removing env vars.
- Follow import ordering and naming conventions.
- Avoid creating new files unless necessary; prefer editing existing modules.
- Keep error handling consistent with project patterns.
- Use path aliases (@/...) for internal imports.
- Do not commit unless user requests; follow Conventional Commits if committing.