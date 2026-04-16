# AGENTS.md — Universal instructions for AI coding agents

This file is for any AI agent working in this repository (Cursor, Codex, Aider, OpenAI agents, etc.). Claude Code reads `CLAUDE.md` first; GitHub Copilot reads `.github/copilot-instructions.md`. Both also pick up this file. The three are kept consistent — start here, then read whichever is relevant to your runtime.

## Project context

- **[CLAUDE.md](CLAUDE.md)** — full project guide: stack, architecture, i18n, caches, intentional patterns, testing.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — development workflow, code style, accessibility requirements, **commit & PR conventions**.
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** — PR-review persona and authoring guidance.

If you only read one of those, read `CLAUDE.md`.

## Commit & PR conventions (must follow)

All commits **and PR titles** must follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). The PR title becomes the squash-merge commit on `main`, so it's held to the same standard as a commit subject.

```
<type>(<scope>)!: <subject>

<optional body — why, not what, wrapped at 100 chars>

<optional footers, e.g. BREAKING CHANGE: …, Co-Authored-By: …>
```

- **Allowed types** (enforced by commitlint): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Recommended scopes** (warning if undocumented): `i18n`, `e2e`, `a11y`, `map`, `menu`, `dialogs`, `share`, `cache`, `overpass`, `lint`, `build`, `deps`, `test`, `docs`, `perf`, `security`, `ci`. Multi-scope is fine (`fix(i18n+e2e):`).
- **Subject**: imperative mood, lowercase first letter, no trailing period, header ≤ 72 chars.
- **Breaking changes**: `!` after type/scope **and** a `BREAKING CHANGE:` footer.
- **Co-author footer**: include `Co-Authored-By: <Agent Name> <noreply@…>` when an AI agent authored the commit.

A `husky` `commit-msg` hook + two CI workflows enforce all of this. Bad messages and bad PR titles will be rejected. Read [`CONTRIBUTING.md#commit-messages`](CONTRIBUTING.md#commit-messages) for the full spec, examples, and rejection cases.

## PR descriptions

When generating a PR description, **fill in [`.github/pull_request_template.md`](.github/pull_request_template.md) exactly** — write the Summary and Test plan from the diff, leave the checkboxes unchecked for the human author/reviewer to verify. Do not strip the a11y / dark mode / i18n / MD3 / data flow / responsive / docs checklists.

## Standard checks before completing work

```bash
npm run lint    # eslint
npm run build   # tsc -b && vite build
npm run test    # vitest
```

E2E tests (`npm run test:e2e`) require a Playwright browser install and are slower — run when touching anything user-facing on the map page.
