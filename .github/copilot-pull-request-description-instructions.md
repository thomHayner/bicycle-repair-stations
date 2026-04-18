# Copilot — Pull request description generation instructions

VSCode reads this file when generating PR titles/descriptions via the Copilot sparkle button in the GitHub PR side panel. The setting `github.copilot.chat.pullRequestDescriptionGeneration.useInstructionFiles` (in `.vscode/settings.json`) opts the workspace into using it.

## PR title

Treat the PR title like a commit subject — we squash-merge, so the title becomes the single commit on `main`. It must follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>)!: <subject>
```

- **Allowed types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Recommended scopes** (warning if undocumented): `i18n`, `e2e`, `a11y`, `map`, `menu`, `dialogs`, `share`, `cache`, `overpass`, `lint`, `build`, `deps`, `test`, `docs`, `perf`, `security`, `ci`. Multi-scope OK with `+`.
- **Subject**: imperative mood, lowercase first letter, no trailing period, total header ≤ 100 chars (commitlint-enforced); aim for ≤ 72 chars for readability/UI truncation.
- **Breaking change**: `!` after type/scope and a `BREAKING CHANGE:` footer (in the description body, not the title).

A CI workflow rejects PRs whose titles don't conform.

## PR body — fill the template, do not replace it

The repo's PR template lives at `.github/pull_request_template.md`. **Reproduce the template structure exactly** — the same `## Summary`, `## Type of change`, `## Test plan`, and `## Checklist` sections with all sub-checklists (Build & Lint, Accessibility, Dialog & Keyboard, Dark Mode, i18n Readiness, MD3 Compliance, Data Flow, Responsive, Docs).

Fill in:

- **Summary**: 1–3 sentences describing what the PR does and why, derived from the diff and any linked issue.
- **Type of change**: leave the radio-style checkboxes unchecked — the human author picks.
- **Test plan**: list the verification steps the diff implies (e.g. "Ran `npm run test` — all pass", "Manual: opened the share sheet on mobile viewport (375px)"). If the diff includes tests, mention them.
- **Checklist**: leave **all** boxes unchecked. The human author/reviewer ticks them after verifying. Do not pre-check anything — even if it looks obvious from the diff that lint passes, the box is the human's confirmation.

Do not strip or condense the checklist. Those prompts catch a11y, i18n, dark mode, and MD3 regressions and are part of the project's review discipline.

## Process

1. Inspect the diff and any linked issue. Identify the dominant intent (feature / fix / refactor / etc.).
2. Compose the title in Conventional Commits format with the right type and scope.
3. Compose the Summary from the diff.
4. Compose the Test plan from what the diff actually verifies (tests added, manual steps implied).
5. Reproduce the rest of the template verbatim.
6. Output the title and body.
