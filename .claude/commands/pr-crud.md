# CRUD Content PR Review

You are reviewing a PR that adds or modifies **CRUD operations** (create, read, update, delete for station data, user data, or similar entities). Read and execute every check in `.claude/commands/_base-review.md` first, then continue with the additional checks below.

## CRUD-Specific Checks

### Data Integrity
- [ ] Verify form inputs have proper validation (required fields, type constraints, length limits).
- [ ] Check that error states are shown to the user for failed operations (not silent failures).
- [ ] Confirm optimistic updates (if any) roll back correctly on error.

### API & Cache Consistency
- [ ] After a create/update/delete: verify the local cache (`stationCache.ts` or equivalent) is invalidated or updated.
- [ ] Check that the Overpass/API fetch logic handles the mutation correctly.
- [ ] Verify no stale data is displayed after a mutation.

### Form Accessibility
- [ ] Every form input has a visible `<label>` element with matching `htmlFor`/`id`.
- [ ] Required fields are indicated both visually and via `aria-required="true"`.
- [ ] Error messages are associated with their inputs via `aria-describedby`.
- [ ] Form submission works via Enter key, not just button click.

### Loading & Confirmation States
- [ ] Verify the UI shows a loading indicator during async operations.
- [ ] Check that destructive actions (delete) require confirmation.
- [ ] Confirm success feedback is provided (toast, redirect, or inline message).

### Mobile UX
- [ ] Verify forms are usable at 375px width.
- [ ] Check that keyboard does not obscure critical form elements on mobile.
- [ ] Confirm touch targets on form controls meet 48x48 dp minimum.

### Security
- [ ] Verify no user input is rendered as raw HTML (`dangerouslySetInnerHTML`).
- [ ] Check that any IDs or tokens in URLs are validated before use.
- [ ] If Stripe-related: confirm PCI-relevant data never touches the client beyond Stripe Elements.

## Output
Produce a summary table of all checks (base + CRUD-specific) with PASS/FAIL/SKIP/WARN status. List any FAIL or WARN items with file paths and line numbers.
