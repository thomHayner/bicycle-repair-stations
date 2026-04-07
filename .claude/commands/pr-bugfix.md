# Bug Fix PR Review

You are reviewing a PR that fixes a **bug**. Read and execute every check in `.claude/commands/_base-review.md` first, then continue with the additional checks below.

## Bug Fix-Specific Checks

### Root Cause
- [ ] Identify and state the root cause of the bug in one sentence.
- [ ] Verify the fix addresses the root cause, not just the symptom.

### Regression Surface
- [ ] Check if the same bug pattern exists elsewhere in the codebase (grep for similar code paths).
- [ ] Verify the fix does not break the happy path of the affected feature.

### Edge Cases
- [ ] If the bug involved null/undefined: verify the fix handles all nullable paths, not just the one that triggered the report.
- [ ] If the bug involved async state: verify race conditions are addressed (abort controllers, stale closure guards).
- [ ] If the bug involved Leaflet: confirm the fix works across zoom levels and map interactions.

### Error Handling
- [ ] If the bug was a crash: verify the error boundary (`ErrorBoundary.tsx`) or error toast (`ErrorToast.tsx`) catches similar failures gracefully.
- [ ] Confirm the fix does not swallow errors silently.

### Minimal Change
- [ ] Verify the diff is focused -- no unrelated formatting changes or refactors mixed in.
- [ ] Flag any changes outside the bug's scope.

## Output
Produce a summary table of all checks (base + bugfix-specific) with PASS/FAIL/SKIP/WARN status. List any FAIL or WARN items with file paths and line numbers.
