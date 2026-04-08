# New Feature PR Review

You are reviewing a PR that adds a **new feature**. Read and execute every check in `.claude/commands/_base-review.md` first, then continue with the additional checks below.

## Feature-Specific Checks

### Routing & Lazy Loading
- [ ] If a new route was added: confirm it is lazy-loaded in `App.tsx` using `lazy()` + `Suspense`, following the existing pattern.
- [ ] Verify the new route is accessible via keyboard navigation from the main app.

### Mobile & Responsive
- [ ] Confirm the feature works at 375px viewport width (iPhone SE).
- [ ] Check that no horizontal overflow is introduced.
- [ ] If map-related: verify Leaflet interactions (zoom, pan, popups) still work on touch.

### Performance
- [ ] Check for unbounded data fetching or missing pagination.
- [ ] Verify any new `useEffect` has correct cleanup (abort controllers, event listener removal).
- [ ] If Leaflet markers or layers are added: confirm they are cleaned up on unmount.

### PWA
- [ ] If new assets (icons, images) were added: verify they work offline or degrade gracefully.
- [ ] Check that any new API calls handle offline state (network error -> user-friendly message).

### Stripe Integration
- [ ] If payment-related: verify Stripe elements are only loaded on the donate route (not globally).
- [ ] Confirm no Stripe secret keys appear in client-side code.

### Documentation
- [ ] If the feature is user-facing: confirm README.md mentions it or a note is flagged for docs update.
- [ ] If new environment variables are required: confirm `.env.example` is updated.

## Output
Produce a summary table of all checks (base + feature-specific) with PASS/FAIL/SKIP/WARN status. List any FAIL or WARN items with file paths and line numbers.
