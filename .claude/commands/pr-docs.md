# Docs / Content PR Review

You are reviewing a **documentation or content** PR. Run ONLY these checks from `.claude/commands/_base-review.md`: Build & Lint, i18n Readiness. SKIP all other base checks. Then continue with the additional checks below.

## Docs-Specific Checks

### Accuracy
- [ ] Verify any code examples or CLI commands in the docs actually work (cross-reference with `package.json` scripts, file paths, etc.).
- [ ] Check that referenced file paths, URLs, and route paths are correct.
- [ ] If `CONTRIBUTING.md` changed: confirm it still matches the actual workflow (branch naming, CI checks, tools).

### Markdown Quality
- [ ] Check for broken links (relative and absolute).
- [ ] Verify consistent heading hierarchy (no skipped levels).
- [ ] Confirm code blocks have language tags for syntax highlighting.

### Content in TSX (Guides, About, etc.)
- [ ] If content was changed in page components: verify the JSX structure is intact.
- [ ] Confirm no a11y regressions in heading order within page content.
- [ ] Check that any new user-facing strings follow i18n readiness guidelines (no concatenated sentences, no hardcoded date/number formats).

### README
- [ ] If `README.md` changed: verify the feature list, setup instructions, and screenshots are still accurate.
- [ ] Check that any badge URLs still resolve.

## Output
Produce a summary table of all checks (applicable base + docs-specific) with PASS/FAIL/SKIP/WARN status. List any FAIL or WARN items with file paths and line numbers.
