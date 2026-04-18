# Skill-creator input: `copilot-recursive-review`

Copy the block below into `skill-creator` (or paste as the initial prompt) to
generate a reusable skill documenting the recursive Copilot-review workflow
we ran on [PR #27](https://github.com/thomHayner/bicycle-repair-stations/pull/27).

---

## Prompt for skill-creator

Create a skill named **`copilot-recursive-review`** that orchestrates an
iterative review loop with the GitHub Copilot PR reviewer until the PR has
no unresolved Copilot comments.

### When the skill should trigger

- User asks to "run a Copilot review", "get Copilot to review PR #N", "do
  recursive Copilot review", or similar.
- User has an open PR and wants automated triage of Copilot feedback.
- Invoked as part of a release / dev→main merge flow.

### Inputs

- PR number (required). If not provided, list open PRs with
  `gh pr list` and ask the user.
- Repo slug (default: current repo via `gh repo view --json nameWithOwner`).
- Optional: poll interval in seconds (default 270 — just under the 5-min
  prompt-cache TTL so context stays warm between wakeups).

### Algorithm

Loop until Copilot posts a review with zero new inline comments, or the
user stops the loop:

1. **Request a review.** `gh pr edit <N> --add-reviewer
   copilot-pull-request-reviewer`. Record the PR HEAD SHA so we can detect
   when Copilot has reviewed the latest commit.
2. **Wait.** Schedule a wakeup (`ScheduleWakeup`) at the poll interval.
   Do not busy-poll.
3. **On wake, check review state.**
   `gh api repos/OWNER/REPO/pulls/<N>/reviews --jq '.[] | select(.user.login=="copilot-pull-request-reviewer") | {id, state, commit_id, submitted_at}'`
   If no review exists for the current HEAD SHA yet, re-schedule another
   wakeup and exit this iteration.
4. **Fetch inline comments** for the latest Copilot review:
   `gh api repos/OWNER/REPO/pulls/<N>/comments --paginate --jq '[.[] | select(.user.login=="copilot-pull-request-reviewer" and .pull_request_review_id==<ID>)]'`.
   If the list is empty and the review state is `APPROVED` or `COMMENTED`
   with no new comments, the loop is done — report success to the user.
5. **Triage each comment.** For every inline comment, decide:
   - **FIX** — the concern is valid; apply the fix.
   - **REJECT** — the concern is wrong (false positive, doesn't apply to
     this codebase, Copilot hallucinated an API). Justify on the thread.
   - **DISCUSS** — genuine open question that needs the user's judgment;
     surface it to the user in chat and leave the thread open.
6. **Verify every "FIX" before committing it.** Apply the edit, then run
   `npm run lint && npm test -- --run && npm run build` (or the repo's
   equivalent). Copilot's claim is sometimes backwards — e.g. on PR #27
   it claimed `react-hooks/exhaustive-deps` would flag a missing module-
   level import dep, but lint actually flagged the *added* dep as
   unnecessary. Verify before you reply.
7. **Reply on GitHub** for each triaged comment.
   `gh api --method POST repos/OWNER/REPO/pulls/<N>/comments/<COMMENT_ID>/replies --input <body.json>`.
   Body format:
   ```
   Triage: **FIX** (applied) | **REJECT** | **DISCUSS**

   <2–4 sentence justification — cite the file, the rule, or the commit
   that confirms your judgment>
   ```
8. **Commit fixes** using Conventional Commits (see repo's
   `CONTRIBUTING.md#commit-messages` / `commitlint.config.mjs`). Reference
   the PR number in the body. Push to the PR branch.
9. **Resolve threads** that do not need follow-up. A thread is "resolved"
   when its triage is **FIX (applied)** or **REJECT with justification**.
   Leave **DISCUSS** threads open.
   Use GraphQL:
   ```
   gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<THREAD_NODE_ID>"}) { thread { isResolved } } }'
   ```
   Get thread IDs with:
   ```
   gh api graphql -f query='query { repository(owner:"O", name:"R") { pullRequest(number:N) { reviewThreads(first:50) { nodes { id isResolved path comments(first:5) { nodes { databaseId author { login } } } } } } } }'
   ```
10. **Re-request Copilot.** `gh pr edit <N> --add-reviewer
    copilot-pull-request-reviewer` — this triggers a fresh review on the
    new HEAD. Go to step 2.

### Practical gotchas discovered on PR #27

- **Shell-quote bodies via `--input <file.json>`, not inline `-f body=...`.**
  Backticks in triage replies (e.g. markdown code-spans) get expanded by
  zsh as command substitution and silently strip content. Write the JSON
  body to a temp file and pipe it with `--input`.
- **`dangerouslyDisableSandbox: true` on `gh` calls** if the environment
  has a corporate TLS proxy — `gh` otherwise fails with cert errors. The
  Claude Code sandbox does not expose system trust settings.
- **Squash-merge `(#NN)` suffix** eats into commitlint `header-max-length`
  — set it to 100 (commitlint-conventional default), not 72.
- **Verify lint claims.** Don't blindly trust Copilot on rule behavior —
  always reproduce with `npm run lint` on the edited tree before
  committing the "fix".
- **Conventional Commits scope `copilot` is not in the default allowlist.**
  Either use an existing scope (`security`, `docs`, `ci`…) or extend
  `commitlint.config.mjs`.
- **Wakeup cadence:** 270s keeps prompt cache warm (5-min TTL). Don't
  pick 300s — worst of both worlds (cache miss + short wait).

### Skill output contract

On each iteration, print a concise status block:

```
Copilot round <N> on PR #<N> @ <SHA>:
  - <M> new comments
  - triaged: <X> FIX, <Y> REJECT, <Z> DISCUSS
  - commit pushed: <short-sha> (if any)
  - threads resolved: <K>
  - next wakeup: <time> | DONE
```

When the loop terminates, summarize all rounds and link the final PR URL.

### Tools the skill uses

- `gh` CLI (PR + API + GraphQL)
- `Bash` for `npm run lint`/`test`/`build`
- `Edit`/`Write` for applying FIX edits
- `ScheduleWakeup` for the polling loop
- `TodoWrite` for per-round tracking

### Files to reference in the packaged skill

- `.claude/commands/commit.md` — Conventional Commits format for the repo
- `CONTRIBUTING.md#commit-messages` — enforced types/scopes
- `commitlint.config.mjs` — local rules
- `docs/adr/ADR-2026-04-15-adopt-structured-pr-review-workflow.md` — the
  broader PR-review philosophy

### Reference session

The prototype run lives in
`/Users/elliot/.claude/projects/-Users-elliot-Desktop-GitHub-bicycle-repair-stations--claude-worktrees-stupefied-agnesi-2e7732/a4c0b6af-402d-407f-b715-8dd7044d6cd4.jsonl`.
Two rounds executed; all 4 threads resolved; commits `13d5c1a` (round 1)
and `d4ad03e` (round 2) on `origin/dev`.
