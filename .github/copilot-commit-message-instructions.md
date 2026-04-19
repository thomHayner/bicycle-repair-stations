# Copilot — Commit message generation instructions

VSCode reads this file when generating commit messages via the "Generate commit message with Copilot" sparkle button in the Source Control panel. The setting `github.copilot.chat.commitMessageGeneration.useInstructionFiles` (in `.vscode/settings.json`) opts the workspace into using it.

## Output format

Produce a single commit message that follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>)!: <subject>

<optional body>

<optional footers>
```

A `husky` `commit-msg` hook runs `commitlint` against this message and a CI workflow re-runs it on push. Non-conformant messages are rejected.

## Allowed types (closed list — `commitlint` will reject anything else)

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Choose by intent of the change, not the file path:

- `feat` — adds new user-visible behavior
- `fix` — corrects a user-visible bug
- `refactor` — restructures code without changing behavior
- `perf` — measurable performance improvement
- `test` — adds or fixes tests only
- `docs` — documentation only (markdown, comments)
- `style` — formatting, whitespace, no behavior change
- `build` — bundler, dependencies, build scripts
- `ci` — `.github/workflows/`, CI config
- `chore` — repo housekeeping that doesn't fit above
- `revert` — reverts a previous commit (include `Reverts: <hash>` footer)

## Recommended scopes (use one when natural)

`i18n`, `e2e`, `a11y`, `map`, `menu`, `dialogs`, `share`, `cache`, `overpass`, `lint`, `build`, `deps`, `test`, `docs`, `perf`, `security`, `ci`

Multi-scope is OK with `+` (e.g. `fix(i18n+e2e):`). Pick the narrowest scope that fits. Undocumented scopes produce a warning, not an error.

## Subject rules

- Imperative mood (`add`, not `added` / `adds`)
- Lowercase first letter
- No trailing period
- Total header length ≤ 100 characters (commitlint-enforced); aim for ≤ 72 when practical
- Describe *what changed* concisely; use the body for *why*

## Body rules (only when needed)

- Wrap at 100 characters per line
- Explain *why* the change is needed, not *what* the diff already shows
- Reference related issues/PRs in footers (`Refs: #123`, `Closes: #45`)

## Breaking changes

Append `!` after type/scope **and** add a `BREAKING CHANGE:` footer:

```
refactor(map)!: change fetchStations to options-object signature

BREAKING CHANGE: fetchStations now takes a single options object;
update all call sites to pass { lat, lon, radiusKm, endpoint }.
```

## Examples (good)

```
feat(i18n): add Tatar (tt) translation files
fix(menu): prevent spurious focus ring on close button when drawer opens
test(e2e): add Playwright end-to-end test suite for share flow
chore(deps): bump vite to 8.0
docs(adr): record decision to enforce conventional commits
perf(map): debounce viewport-change handler to reduce re-renders
```

## Examples (rejected)

```
Update e2e/share.spec.ts            # missing type
Fixed the bug                       # past tense, missing type
feat: Added new locale.             # past tense, capitalized, trailing period
feat: very long subject that exceeds the seventy-two character limit and gets cut off
```

## Process

1. Inspect the staged diff. Identify the dominant intent — feature, bug, refactor, etc.
2. If the diff spans multiple unrelated changes, suggest the user split the commit; otherwise pick the type that captures the primary change.
3. Pick the narrowest applicable scope from the list above (or omit if none fits).
4. Write the subject from the diff in imperative mood.
5. Add a body only if *why* isn't obvious from the diff.
6. Output the message — nothing else.
