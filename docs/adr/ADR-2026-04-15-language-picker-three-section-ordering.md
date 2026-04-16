---
id: ADR-2026-04-15-language-picker-three-section-ordering
title: Order the language picker as English → major world languages → alphabetical
status: accepted
date: 2026-04-15
deciders: [tom]
tags: [i18n, ux]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 language picker sorting
---

## Context

After a series of expansion rounds, `SUPPORTED_LOCALES` in
`src/i18n/locales.ts` grew to 92 entries. The previous ordering
was the historical accrual order — roughly grouped by region
(DACH, Francophone, Hispanic, …) and then by the chronological
order in which languages were added. With 92 entries, that
grouping no longer helped anyone scan the list. The user asked
for an explicit ordering scheme.

## Decision

Group `SUPPORTED_LOCALES` into three sections in this order:

1. **English** alone at the top (the default locale).
2. **Major world languages**, twelve entries, in this fixed
   hand-curated order: Dutch, French, Spanish, Italian,
   Portuguese, German, Russian, Japanese, Korean, Chinese
   (Traditional), Chinese, Arabic.
3. **All other languages**, sorted alphabetically by English
   name, from Afrikaans to Zulu.

Section boundaries are marked with inline comments in the
source. The two Chinese entries sit next to each other at the
end of the CJK block, with Traditional Chinese first.

## Alternatives considered

- **Fully alphabetical across all 92 entries** — rejected.
  Buries English, the default and most likely match for many
  users, somewhere in the middle of the list; also buries the
  common European/East-Asian languages that most visitors will
  reach for.
- **Promote Hindi, Bengali, Urdu, Turkish, Farsi, Vietnamese,
  Thai, Polish, Ukrainian, Tagalog, Malay/Indonesian, or
  Swahili into section 2** on the grounds that each has tens
  or hundreds of millions of speakers — explicitly offered to
  the user, explicitly declined. The user wanted section 2 to
  stay as a small curated set rather than grow with speaker
  counts.
- **Order by speaker count** — not chosen. Would force
  ongoing maintenance as speaker-count estimates shift, and
  disagrees with the user's intuition about which languages
  deserve top billing.
- **Group by region in section 2** (e.g., European block,
  East Asian block, …) — not chosen. The user specified an
  explicit order that interleaves regions
  (Dutch→French→Spanish→Italian→Portuguese→German→Russian→
  Japanese→Korean→Chinese→Arabic), so region-blocking would
  contradict it.

## Consequences

- **Positive:**
  - The picker is scannable at a glance: English → familiar
    majors → alphabetical long tail.
  - Adding new languages has an obvious home — section 3,
    inserted in alphabetical order — with no debate about
    promotion.
  - The curated section 2 order is stable across future
    additions; it never needs re-sorting.
- **Negative:**
  - Speakers of large languages in section 3 (Hindi, Bengali,
    Urdu, …) have to scan past smaller languages in section 2
    to find theirs. IP-based auto-detection mitigates this for
    most users; the picker is the fallback.
  - Section 2 membership is a judgment call, not a formula.
    Future requests to promote a language will need to be
    resolved case-by-case and will probably want another ADR.
- **Follow-ups:**
  - None immediate. If the picker UI ever renders the three
    sections with visual dividers, the inline comments in
    `locales.ts` are the source of truth for where to break.

## Notes

- The fixed order of section 2 was specified by the user
  verbatim in the session: "put english at the top, with a
  section divider, then dutch, french, spanish italian
  portuguese, german, russian japanese, taiwan, korean,
  chinese, arabic". The final committed order adjusts only
  the Japanese/Korean/Chinese(Traditional)/Chinese sub-order
  per a follow-up instruction ("Japanese, Korean, Taiwanese,
  Chinese, Arabic").
- "Taiwanese" in the user's phrasing refers to the
  `zh-Hant` (Traditional Chinese) entry, not a separate
  Taiwanese Hokkien locale.
