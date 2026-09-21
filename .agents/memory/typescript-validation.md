---
name: One-off TypeScript validation
description: How to run isolated TypeScript assertions without adding dependencies.
---

Do not assume a standalone `tsx` command is available in this workspace. Prefer the project’s registered typechecks and production builds. For isolated TypeScript assertions, use the compiler already available through the API server package and execute the generated temporary JavaScript from `/tmp`.

**Why:** Direct Node loader and workspace-level `pnpm exec tsx` approaches are unavailable here, while the API server’s existing compiler can bundle an isolated module without changing dependencies.

**How to apply:** Use this only for temporary validation that does not justify a committed test file. Resolve source and alias paths relative to the API server package because filtered package commands run from that package directory.