# Chore PR Review

You are reviewing a **chore** PR (dependency updates, CI config, build config, tooling). Read and execute the checks in `.claude/commands/_base-review.md` first, but SKIP these base sections that are unlikely to apply: Dark Mode, Dialog Keyboard Behavior, MD3 Compliance, i18n Readiness. Then continue with the additional checks below.

## Chore-Specific Checks

### Dependency Updates
- [ ] If `package.json` changed: compare old and new versions. Flag any major version bumps.
- [ ] If `package-lock.json` changed: confirm it was regenerated (not manually edited).
- [ ] Check that no new dependencies duplicate existing functionality.
- [ ] Verify no dependency has a known vulnerability (check if `npm audit` would flag it).

### Config Changes
- [ ] If `vite.config.ts` changed: verify `npm run build` and `npm run dev` still work.
- [ ] If `tsconfig*.json` changed: verify no new type errors from stricter settings.
- [ ] If `eslint.config.js` changed: verify `npm run lint` passes and no rules were silently disabled.
- [ ] If `vercel.json` changed: verify redirect/rewrite rules do not break existing routes.

### CI Changes
- [ ] If `.github/workflows/ci.yml` changed: verify the job matrix and steps are correct.
- [ ] Confirm no secrets or tokens are hardcoded.

### PWA Config
- [ ] If PWA/service-worker config changed (`vite-plugin-pwa` settings in `vite.config.ts`): verify offline behavior is not regressed.

## Output
Produce a summary table of all checks (applicable base + chore-specific) with PASS/FAIL/SKIP/WARN status. List any FAIL or WARN items with file paths and line numbers.
