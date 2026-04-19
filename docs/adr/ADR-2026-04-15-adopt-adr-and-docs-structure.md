---
id: ADR-2026-04-15-adopt-adr-and-docs-structure
title: Adopt ADR folder and reserve wiki/ for future LLM-Wiki layer
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [documentation, process, tooling]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15
---

## Context

Past Claude Code sessions have produced meaningful architectural
decisions — trade-offs around rendering patterns, caching, i18n
scope, intentional ESLint disables, and more — but those decisions
currently live only in chat transcripts and in `CLAUDE.md`'s
"Intentional Patterns" section. There is no durable, discoverable,
queryable place to record *why* a decision was made and what was
rejected. I'm about to harvest decisions from prior sessions and
need somewhere to put them.

Separately, I want to set up a scaffold for a future LLM-Wiki layer
that will ingest `docs/` (including ADRs) as a raw source directory
and synthesize navigable documentation. That layer doesn't exist
yet, but the folder it will live in should be reserved now so
neither humans nor agents start putting hand-authored content
there by accident.

The choice of structure was non-obvious because there are several
established conventions (MADR, Nygard-style numbered ADRs, Diátaxis)
and several places the wiki placeholder could live (`.claude/wiki`,
`docs/wiki`, `wiki/`).

## Decision

Adopt a `docs/adr/` folder containing markdown ADRs with YAML
frontmatter, named with date-based slugs
(`ADR-YYYY-MM-DD-kebab-case-slug.md`), seeded with a `TEMPLATE.md`
and a short `README.md` explaining the convention. Reserve a
top-level `wiki/` directory (tracked via `.gitkeep`) for a future
LLM-Wiki layer, and document in `CLAUDE.md` that `wiki/` should be
left alone for now.

## Alternatives considered

- **Sequential ADR numbering (ADR-0001, ADR-0002, …)** — rejected.
  Numbering collides when multiple Claude Code sessions or branches
  create ADRs in parallel, and renaming after the fact breaks links.
  Date-based slugs are naturally collision-resistant and carry
  useful context.
- **Pure YAML or JSON records** — rejected. ADRs are prose-heavy by
  nature (context, rationale, consequences). Structured data inside
  the record loses nuance; markdown with YAML frontmatter gives us
  both queryability and readable prose.
- **Put `wiki/` under `.claude/`** — rejected. The wiki is a
  first-class project artifact intended for human readers as much
  as agents; it isn't Claude Code configuration. Nesting it under
  `.claude/` would mis-categorize it and make it less discoverable.
- **Skip the wiki placeholder entirely** — rejected. Without a
  reserved folder, either humans would start putting synthesized
  docs in `docs/` (blurring the raw-vs-synthesized line) or the
  LLM-Wiki layer would have no obvious home when it lands.

## Consequences

- **Positive:**
  - Decisions from past and future Claude Code sessions have a
    standard, discoverable home.
  - Frontmatter (status, tags, supersedes, related) makes ADRs
    queryable — e.g., "show me all superseded decisions about
    caching."
  - Clean separation between human-authored `docs/` (raw source)
    and future LLM-maintained `wiki/` (synthesized).
  - Date-based slugs tolerate parallel sessions without rename
    churn.
- **Negative:**
  - No enforced schema on ADR content — quality depends on author
    discipline (or agent prompt quality).
  - ADRs can drift out of sync with code if not maintained; status
    lifecycle mitigates but doesn't eliminate this.
- **Follow-ups:**
  - Harvest existing decisions from prior Claude Code sessions and
    backfill as ADRs.
  - Decide when the LLM-Wiki layer is ready to be built out, and
    what ingests into it (only `docs/`? also source code? git
    history?).
  - Consider a lightweight `scripts/new-adr.sh` helper if manual
    copying becomes a friction point.

## Notes

- The first harvest pass will likely surface some decisions already
  captured informally in the "Intentional Patterns — Do Not Flag"
  section of `CLAUDE.md`; those can be promoted into proper ADRs
  and the `CLAUDE.md` section left as a brief index.
- The `wiki/` placeholder uses `.gitkeep` so the empty folder is
  tracked — otherwise git would drop it and the reservation
  wouldn't survive a fresh clone.
