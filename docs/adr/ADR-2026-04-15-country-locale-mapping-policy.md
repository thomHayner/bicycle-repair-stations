---
id: ADR-2026-04-15-country-locale-mapping-policy
title: Map countries to their native official language, not to the most widely spoken second language; leave minority languages unmapped
status: accepted
date: 2026-04-15
deciders: [tom]
tags: [i18n, geolocation]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 country-to-locale policy
---

## Context

`COUNTRY_TO_LOCALE` in `src/i18n/locales.ts` maps an
IP-detected ISO country code to a suggested locale. As new
languages were added in this session (Irish, Luxembourgish,
Basque, Tatar, Dzongkha, Dhivehi, plus fill-in mappings for
Brunei, Timor-Leste, North Korea, Palestine), we had to
decide — repeatedly — whether to override or leave country
defaults. Two recurring patterns appeared:

1. Countries where the **official native language** is not
   the most commonly spoken language in practice (e.g.,
   Ireland: Irish is official, but English dominates
   day-to-day; Brunei: Malay is official, but English is
   widely used; Timor-Leste: Portuguese is official, Tetum is
   more spoken).
2. Languages spoken by a **minority population within a
   larger sovereign state** (e.g., Basque in Spain/France;
   Tatar in Russia).

Without an explicit policy, these would be decided
inconsistently per addition.

## Decision

Adopt the following policy for entries in `COUNTRY_TO_LOCALE`:

1. **Map each country to its primary official native
   language**, even when a different widely-spoken language
   (often English) could plausibly win. Examples applied this
   session:
   - `IE → "ga"` (Irish), not `en`
   - `LU → "lb"` (Luxembourgish), not `fr`/`de`
   - `BN → "ms"` (Malay), not `en`
   - `TL → "pt"` (Portuguese)
   - `KP → "ko"` (Korean)
   - `BT → "dz"` (Dzongkha)
   - `MV → "dv"` (Dhivehi)
   - `PS → "ar"` (Arabic)
2. **Do not add a country mapping for a language that is a
   minority within a larger nation-state.** The speakers must
   manually select it from the picker. Applied this session:
   - No mapping for Basque (`eu`) — speakers in ES/FR stay on
     the country default (`es`/`fr`).
   - No mapping for Tatar (`tt`) — speakers in Russia stay on
     the country default (`ru`).

The policy is documented inline in `locales.ts` via comments
at the relevant mapping sites.

## Alternatives considered

- **Map to the most widely spoken language in each country,
  regardless of official status** (e.g., `IE → "en"`) —
  rejected. This would undercut the whole point of supporting
  languages like Irish, Luxembourgish, and Dzongkha: speakers
  who want them would have to manually change locale anyway,
  and non-speakers can trivially switch to English (or
  whichever alternate) via the picker. The user's framing
  throughout the session was that the IP-suggested default
  should be a country's *own* language when a usable one
  exists.
- **Also auto-map minority languages** (e.g., `ES → "eu"`
  for visitors geolocated in Spain) — rejected. It would be
  wrong for the majority of Spanish/French visitors, and we
  have no way to distinguish at the country level. Region-
  level geolocation was not available/considered.
- **Add a "dominant vs official" preference field to
  locales.ts** so each country could record both — rejected
  as over-engineering. A simple mapping with clear policy is
  enough.

## Consequences

- **Positive:**
  - Adding a new locale now has a clear decision rule: single
    official native language → add country mapping; regional
    minority language → no country mapping.
  - Speakers of smaller official languages get their UI in
    their own language on first visit. This is the primary
    signal of respect for minority official languages.
  - Auto-detection never produces surprising results for
    majority-language users (Russians still get Russian,
    Spaniards still get Spanish).
- **Negative:**
  - Irish visitors — most of whom are more comfortable in
    English — will get a Gaeilge UI by default and need to
    switch. Same for Brunei visitors (Malay), Timor-Leste
    visitors (Portuguese), etc. Mitigated by the picker being
    prominent and the language switch being persisted in
    `localStorage`.
  - Basque and Tatar speakers have to manually pick their
    language on every new device. Not a regression — it was
    the status quo; the policy just makes it explicit.
- **Follow-ups:**
  - If geolocation ever exposes subnational regions
    (Catalonia, Tatarstan, Basque Country, …), we could
    revisit and add region-level mappings. Not planned.
  - Countries with two co-equal official languages (e.g.,
    Canada EN/FR, Belgium NL/FR/DE, Finland FI/SV) are
    already resolved by picking one; those earlier choices
    are not revisited here.

## Notes

- The `PS → "ar"` addition was a small fill-in during the
  "did we cover all the Middle East?" pass; it's the same
  policy applied to a country that had been missed.
- Inline comments at `RU:` and `BA:` (Basque) / no mapping
  for `tt` note explicitly that these locales are
  manual-select. Future contributors reading `locales.ts`
  should see the policy in context without having to find
  this ADR.
