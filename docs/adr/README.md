# Architecture Decision Records (ADRs)

This folder holds **ADRs** — short, durable records of decisions that
shaped the project. Each ADR captures the context, the decision, the
alternatives that were considered, and the consequences. The goal is
that future contributors (human or AI) can understand *why* the code
looks the way it does, not just *what* it does.

## Naming convention

ADR files are named:

```
ADR-YYYY-MM-DD-kebab-case-slug.md
```

Date-based slugs are used instead of sequential numbers (ADR-0001,
ADR-0002, …) to avoid collisions across parallel Claude Code sessions
or branches. Multiple ADRs on the same day are fine — differentiate
them via the slug.

## Creating a new ADR

1. Copy [`TEMPLATE.md`](TEMPLATE.md) to a new file using the naming
   convention above.
2. Fill in the frontmatter and each section.
3. Commit alongside (or just after) the code change the ADR describes.

### Frontmatter conventions

- **`deciders`** — YAML list of **GitHub handles** (case-sensitive, no
  `@`), e.g. `deciders: [thomHayner]`. Prefer handles over display names
  so tooling/grep is reliable across ADRs. Multiple deciders: `[alice,
  bob]`. If an AI agent co-authored the decision, include a human
  decider — agents are credited in commit footers, not in `deciders`.

## Status lifecycle

```
proposed → accepted → superseded | deprecated
                   ↘ rejected
```

- **proposed** — under discussion, not yet in effect
- **accepted** — in effect; the current decision
- **superseded** — replaced by a later ADR (link it via `superseded_by`)
- **deprecated** — no longer in effect, but not replaced
- **rejected** — considered and turned down

Never delete an ADR. Update its status instead. The record of what was
*not* chosen is as valuable as what was.

## Relationship to `wiki/`

ADRs are a raw source for the future `wiki/` layer, which will
synthesize narrative documentation from ADRs, code, and other
`docs/` content. Write ADRs for humans first; the wiki layer will
handle aggregation.
