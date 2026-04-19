---
id: ADR-2026-04-15-donate-button-schema-plain-verb
title: donateButton key is a plain verb; donateAmount carries the {{amount}} interpolation
status: accepted
date: 2026-04-15
deciders: [thomHayner]
tags: [i18n, donate, schema]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 copilot-review-donate-interpolation
---

## Context

The `donate` i18n namespace has two keys that render on the donate button:

- `donateButton` — shown when no amount has been selected (button is
  disabled, no amount to display)
- `donateAmount` — shown when an amount is selected (button is enabled)

`DonatePage.tsx` renders them as:

```ts
{loading
  ? t("redirecting")
  : effectiveAmount !== null
    ? t("donateAmount", { amount: effectiveAmount })
    : t("donateButton")}
```

Critically, `t("donateButton")` is called **without** passing `{ amount }`.
When 15 locale `donate.json` files were generated, they used
`"${{amount}} USD donate-verb"` as the `donateButton` value. Because no
`amount` interpolation is passed, i18next would render the raw
`${{amount}}` placeholder string as-is — visible to users in those locales
as broken copy.

## Decision

`donateButton` in every locale must be a plain verb with no interpolation
variables (e.g., `"Donate"`, `"दान करें"`, `"捐款"`). The `${{amount}} USD`
prefix belongs exclusively in `donateAmount`, which is always called with
`{ amount }`.

The 15 affected locale files (af, am, bn, ca, ha, hi, is, ku, ky, so, sw,
ti, tk, yo, zh-Hant) were corrected by stripping the `${{amount}} USD`
prefix from `donateButton`, leaving only the native-language verb.

## Alternatives considered

- **Always pass `{ amount }` to `donateButton`** — would require the
  component to always have a selected amount when rendering `donateButton`,
  which contradicts the UX: `donateButton` is the prompt before any amount
  is selected. Not feasible.
- **Merge `donateButton` and `donateAmount` into one key with optional
  interpolation** — would require conditional logic in the translation
  string or the component. More complex with no benefit.

## Consequences

- **Positive:** Users in all 97 locales see a clean, translated verb as
  the default button label.
- **Positive:** The schema contract is explicit: `donateButton` never needs
  interpolation; `donateAmount` always gets `{ amount }`.
- **Negative:** Future locale files must follow this convention. If a new
  locale is added with `${{amount}}` in `donateButton`, the raw placeholder
  will appear silently — there is no runtime warning.
- **Follow-ups:** Consider adding a locale schema validation script (or
  i18next type generation) that flags interpolation variables in keys that
  the component never passes context for.

## Notes

The `donateAmount` key in English is `"Donate ${{amount}} USD"` —
the full button label when an amount is active. The `presetAmount` key
(`"${{amount}} USD"`) is a separate, shorter label used on the preset
amount pills, not the button.
