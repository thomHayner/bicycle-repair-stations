# Accessibility Notes

This project treats accessibility as a product requirement, not a polish step.

## Intentional patterns in this codebase

- Landmark structure is intentional: app shell content is inside `main`, and the ad slot is a complementary region.
- Icon-only controls keep explicit accessible names via `aria-label`.
- Dialog components (menu drawer and share sheet) use:
  - `role="dialog"`
  - `aria-modal="true"`
  - title association via `aria-labelledby`
  - keyboard behaviors: initial focus, focus trap, Escape-to-close, focus return
- Dynamic status components use live regions intentionally (`role="status"`, `aria-live`).
- Leaflet attribution colors are explicitly styled for contrast in both light and dark themes.

## Rule of thumb

Do not remove ARIA attributes or focus-management code unless you are replacing it with an equal or better accessible behavior.

Tooltip attributes (`title`) are supplemental only and are not an accessibility substitute.

## Local verification checklist

1. Build check:

```bash
npm run build
```

2. Automated axe checks (example routes):

```bash
npx --yes @axe-core/cli http://127.0.0.1:4173/ --exit
npx --yes @axe-core/cli http://127.0.0.1:4173/about --exit
npx --yes @axe-core/cli http://127.0.0.1:4173/guides --exit
npx --yes @axe-core/cli http://127.0.0.1:4173/donate --exit
npx --yes @axe-core/cli http://127.0.0.1:4173/report-bug --exit
```

3. Manual keyboard smoke check:

- Tab/Shift+Tab order is logical and visible.
- Icon-only controls announce meaningful names.
- Menu/share dialogs trap focus.
- Escape closes dialogs and returns focus to trigger.
- Enter/Space activate controls as expected.

## PR expectations

If a PR changes controls, overlays, dialogs, map marker interactivity, or top-level page structure, include accessibility notes in the PR description:

- What changed
- Why it is accessible
- What was tested (axe routes + manual keyboard checks)
