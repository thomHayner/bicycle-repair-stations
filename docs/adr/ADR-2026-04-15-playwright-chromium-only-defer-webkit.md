---
id: ADR-2026-04-15-playwright-chromium-only-defer-webkit
title: Playwright E2E suite runs Chromium only — WebKit/Safari testing deferred
status: accepted
date: 2026-04-15
deciders: [thom]
tags: [testing, e2e, playwright, ci]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-15 playwright-setup-and-copilot-review
---

## Context

When the Playwright E2E suite was added, a second test project was
configured using `devices["iPhone 14"]` to get mobile viewport, UA string,
and touch emulation. The project was initially named `mobile-safari`,
implying WebKit/Safari engine coverage. However, without explicitly setting
`browserName: "webkit"`, Playwright runs the project on Chromium's engine
— `devices["iPhone 14"]` only provides device simulation metadata, not an
engine switch.

A GitHub CoPilot review flagged the misleading name. The alternative of
actually enabling WebKit was evaluated but deferred.

## Decision

Rename the project to `mobile-chromium` to accurately reflect that it runs
on Chromium with iPhone 14 device settings. Do **not** add
`browserName: "webkit"` at this time. Two tests are already annotated with
`test.skip(browserName === "webkit")` due to known WebKit headless
reliability issues:

- Clipboard permissions (`context.grantPermissions(["clipboard-write"])`)
  not available in WebKit headless mode.
- LoadingOverlay attachment timing is flaky under WebKit headless.

Adding real WebKit testing would require:
1. Installing the Playwright WebKit binary in CI
2. Resolving or permanently skipping the two known-flaky tests
3. Accepting slower CI runs

## Alternatives considered

- **Add `browserName: "webkit"` now** — surfaced real Safari-engine
  rendering differences, but two existing tests would fail or require
  permanent skips with no plan to fix. Adds CI binary download cost.
  Deferred to a future task.
- **Remove the mobile project entirely** — loses mobile viewport coverage.
  Rejected.
- **Keep the `mobile-safari` name** — misleading to any contributor who
  assumes it covers Safari rendering. Rejected.

## Consequences

- **Positive:** CI is honest about what it covers; the project name matches
  the actual browser engine.
- **Positive:** No new CI install cost or flaky test risk.
- **Negative:** No Safari/WebKit engine coverage. Safari-specific rendering
  bugs will not be caught by automated tests.
- **Follow-ups:** A future task should add a third `webkit` project, fix
  or skip the clipboard and overlay timing issues in WebKit headless, and
  add the WebKit binary to the CI install step.

## Notes

The two `test.skip(browserName === "webkit")` annotations in
`e2e/map-core.spec.ts` and `e2e/share.spec.ts` are the concrete blockers
for enabling WebKit. They are documented at the test level with comments
explaining why.
