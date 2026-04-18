# Contributing to BicycleRepairStations.com

Thanks for your interest in contributing! This is a small open-source project — any help is welcome.

## Ways to contribute

| Type | How |
|------|-----|
| **Add a missing station** | Edit it on [OpenStreetMap](https://www.openstreetmap.org/edit) — stations tagged `amenity=bicycle_repair_station` appear in the app within ~24 hours. No code needed. |
| **Bug report** | [Open a bug report](../../issues/new?template=bug_report.yml) |
| **Feature suggestion** | [Open a feature request](../../issues/new?template=feature_request.yml) |
| **Code contribution** | Fork → branch → PR (see below) |

---

## Development setup

**Prerequisites:** Node 20+, npm 10+

```bash
git clone https://github.com/thomHayner/bicycle-repair-stations.git
cd bicycle-repair-stations
npm install
cp .env.example .env   # edit if you want a different Overpass mirror or default radius
npm run dev            # http://localhost:5173
```

---

## Workflow

1. **Open an issue first** for anything beyond a trivial fix, so we can agree on the approach before you invest time coding.
2. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b fix/your-description
   # or
   git checkout -b feat/your-description
   ```
3. Make your changes. Run `npm run build` locally before pushing — the CI check runs the same command.
4. Open a pull request against `main`. Fill in the PR template. **The PR title must follow Conventional Commits** (see [Commit messages](#commit-messages)) — it becomes the squash-merge commit on `main`.
5. A maintainer will review and merge.

---

## Code style

- **TypeScript** — no `any`, no `ts-ignore` without a comment explaining why.
- **Tailwind** — use existing colour tokens and spacing scale; don't add arbitrary values without justification.
- **Accessibility** — all new text/background combinations must meet WCAG AA (4.5 : 1). Interactive elements should meet AAA (7 : 1). Check with the browser DevTools contrast checker.
- **ARIA semantics are intentional** — preserve landmarks, control names, dialog semantics, and live-region behavior unless the change is a clear accessibility improvement.
- **Do not use tooltip text as accessibility text** — `title` is supplemental only; rely on visible labels and ARIA attributes.
- **Dialog behavior is required** — modals/drawers must support initial focus, focus trap, Escape close, and focus return.
- **Mobile-first** — test at 375 px width (iPhone SE viewport) before opening a PR.

### Accessibility regression checks

Before opening a UI-affecting PR, run:

```bash
npm run build
```

Then run axe against each changed route (example):

```bash
npx --yes @axe-core/cli http://127.0.0.1:4173/ --exit
npx --yes @axe-core/cli http://127.0.0.1:4173/about --exit
```

Also perform a quick keyboard check:

- Tab/Shift+Tab order is logical and visible.
- Icon-only controls announce meaningful names.
- Dialogs trap focus, close on Escape, and return focus to trigger.

---

## Commit messages

All commits **and PR titles** must follow the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification. We squash-merge, so the PR title becomes the single commit on `main` — the PR title is held to the same standard as a commit subject.

This is enforced both locally (via a `husky` `commit-msg` hook running `commitlint`) and in CI (workflows lint every commit in a PR plus the PR title).

### Format

```
<type>(<scope>)!: <subject>

<body — optional, why not what, wrapped at 100 chars>

<footer(s) — optional>
```

The `(<scope>)` and `!` (breaking-change marker) are both optional. A footer like `BREAKING CHANGE: <description>` is **required** for breaking changes.

### Allowed types (enforced)

| Type       | When to use                                                     |
|------------|-----------------------------------------------------------------|
| `feat`     | A new user-visible feature                                      |
| `fix`      | A user-visible bug fix                                          |
| `docs`     | Documentation-only change                                       |
| `style`    | Formatting / whitespace; no behavior change                     |
| `refactor` | Code change that neither fixes a bug nor adds a feature         |
| `perf`     | Performance improvement                                         |
| `test`     | Adding or fixing tests                                          |
| `build`    | Build system, bundler, or external-dependency changes           |
| `ci`       | CI configuration (`.github/workflows/`, etc.)                   |
| `chore`    | Tooling, repo housekeeping that doesn't fit above               |
| `revert`   | Reverts a previous commit (include `Reverts: <hash>` in footer) |

### Recommended scopes

Pick the narrowest scope that fits. Multi-scope is OK with `+` (e.g. `fix(i18n+e2e):`).

`i18n`, `e2e`, `a11y`, `map`, `menu`, `dialogs`, `share`, `cache`, `overpass`, `lint`, `build`, `deps`, `test`, `docs`, `perf`, `security`, `ci`

Undocumented scopes produce a `commitlint` warning, not an error — extend the list when a scope appears repeatedly.

### Subject rules

- Imperative mood (`add`, not `added` or `adds`)
- Lowercase first letter
- No trailing period
- ≤ 100 characters total header length (commitlint config-conventional default; leaves room for GitHub's auto-appended `(#NN)` on squash-merges). Aim for ≤ 72 on the human-authored part so GitHub's PR UI doesn't truncate.

### Examples

Good:

```
feat(i18n): add Tatar (tt) translation files
fix(menu): prevent spurious focus ring on close button when drawer opens
test(e2e): add Playwright end-to-end test suite
chore(deps): bump vite to 8.0
refactor(map)!: change fetchStations to options-object signature

BREAKING CHANGE: fetchStations now takes a single options object;
update all call sites to pass { lat, lon, radiusKm, endpoint }.
```

Bad (rejected by commitlint):

```
Update e2e/share.spec.ts            # missing type
Fixed the bug                       # past tense, missing type
feat: Added new locale.             # past tense, capitalized, trailing period
feat: very long subject that exceeds the one-hundred character header length limit enforced by config
```

### Co-author footers

When an AI agent (Claude Code, Copilot, etc.) authors a commit, include a `Co-Authored-By:` footer per GitHub's format:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

This is automatic for Claude Code's commit workflow.

---

## Licence

By contributing you agree that your changes will be released under the [MIT Licence](LICENSE).
