---
id: ADR-2026-04-15-copilot-review-philosophy-holistic-not-partitioned
title: Give CoPilot a complementary review instinct, not a partitioned scope
status: accepted
date: 2026-04-15
deciders: [elliot]
tags: [workflow, tooling, pr-review]
supersedes: []
superseded_by: []
related: [ADR-2026-04-15-adopt-structured-pr-review-workflow]
source: claude-code-session-2026-04-15 copilot instructions setup
---

## Context

The project uses Claude Code's `pr-review-toolkit` for automated PR reviews.
That reviewer acts as a precision auditor: CLAUDE.md rule compliance, bug
detection with confidence scoring (only issues ≥ 80 reported), null/undefined
handling, race conditions, memory leaks, hook dependency arrays, type design.
The PR checklist template independently covers a11y, dark mode, i18n, MD3
compliance, responsive, and data flow.

GitHub CoPilot also performs PR reviews via `.github/copilot-instructions.md`.
The question was how to shape CoPilot's instructions relative to Claude Code's
so that having two reviewers adds value rather than just doubling the same
output.

The first draft of the CoPilot instructions file included an explicit
**skip list** — a section titled "What to skip — do not duplicate these" that
enumerated categories Claude Code already covers (TypeScript/ESLint errors,
hook dep arrays, WCAG contrast, aria-label presence, dark mode coverage,
missing `t()` wrappers, cache invalidation logic, null/undefined crashes,
race conditions, memory leaks) and told CoPilot not to spend comment budget
on them.

## Decision

We removed the skip list entirely. CoPilot reviews the whole PR — security,
logic, style, tests, accessibility, everything — but its *instincts* are tuned
to a different lens than Claude Code's: developer experience, user scenarios,
future-proofing (footguns), API ergonomics, and pattern consistency. The
instruction file uses the "second parent searching the room" metaphor: each
parent covers the whole room but notices different things because of how they
see. When both reviewers flag the same issue that counts as confirmation, not
redundancy.

## Alternatives considered

- **Partition responsibility via a skip list** — CoPilot explicitly skips
  things Claude Code covers so there is zero overlap. Rejected by the author
  with the framing: "when two parents search a kids room, they each look at it
  from different perspectives and notice different things, they have their own
  way of doing things, but each still searches the whole room." A skip list
  imposes a division of labour that is artificial and fragile.
- **Mirror Claude Code's style** — Give CoPilot the same confidence-scoring,
  rule-compliance focus as Claude Code. Not discussed explicitly, but
  obviously rejected because it would produce duplicated output with no
  complementary value.

## Consequences

- **Positive:** Two reviewers with genuinely different instincts surface a
  broader range of issues than either alone. Overlap on the same issue
  provides useful signal about severity — if both flag it, it probably
  matters.
- **Negative:** CoPilot's comments may sometimes be redundant with Claude
  Code's on clear-cut issues; the author accepted this as a worthwhile
  trade-off.
- **Follow-ups:** Calibrate in practice. If CoPilot's comments consistently
  duplicate Claude Code's rather than adding perspective, tighten the persona
  description or add more calibrating worked examples to
  `.github/copilot-instructions.md`. Conversely, if CoPilot drifts toward
  pure style commentary and ignores the five emphasis labels (`[DX]`,
  `[SCENARIO]`, `[FOOTGUN]`, `[ERGONOMICS]`, `[CONSISTENCY]`), the worked
  examples section is the lever to pull.

## Notes

- The five natural emphasis labels written into the instruction file:
  `[DX]` (naming, cognitive load), `[SCENARIO]` (user experience under
  failure/slowness/emptiness), `[FOOTGUN]` (works now, invites future bugs),
  `[ERGONOMICS]` (API usability), `[CONSISTENCY]` (pattern drift vs. rest of
  codebase).
- Worked examples in the instruction file are anchored to real patterns in
  this codebase: the `programmaticMoveRef` counter, `L.divIcon` i18n gap,
  the positional `fetchStations` args, and the three independent localStorage
  cache implementations.
- The session also created `CLAUDE.md` at the repo root (previously missing),
  which gives Claude Code's `code-reviewer` agent the project-specific
  conventions it loads. This was a gap-fill, not a design choice, so no
  separate ADR was written for it.
