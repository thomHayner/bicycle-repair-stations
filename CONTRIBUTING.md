# Contributing to BicycleRepairStations.com

Thanks for your interest in contributing! This is a small open-source project — any help is welcome.

## Ways to contribute

| Type | How |
|------|-----|
| **Add a missing station** | Edit it on [OpenStreetMap](https://www.openstreetmap.org/edit) — stations tagged `amenity=bicycle_repair_station` appear in the app within ~24 hours. No code needed. |
| **Bug report** | [Open a bug report](../../issues/new?template=bug_report.yml) |
| **Feature suggestion** | [Open a feature request](../../issues/new?template=feature_request.yml) |
| **Code contribution** | Fork → branch → PR (see below) |

---

## Development setup

**Prerequisites:** Node 20+, npm 10+

```bash
git clone https://github.com/thomHayner/bicycle-repair-stations.git
cd bicycle-repair-stations
npm install
cp .env.example .env   # edit if you want a different Overpass mirror or default radius
npm run dev            # http://localhost:5173
```

---

## Workflow

1. **Open an issue first** for anything beyond a trivial fix, so we can agree on the approach before you invest time coding.
2. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b fix/your-description
   # or
   git checkout -b feat/your-description
   ```
3. Make your changes. Run `npm run build` locally before pushing — the CI check runs the same command.
4. Open a pull request against `main`. Fill in the PR template.
5. A maintainer will review and merge.

---

## Code style

- **TypeScript** — no `any`, no `ts-ignore` without a comment explaining why.
- **Tailwind** — use existing colour tokens and spacing scale; don't add arbitrary values without justification.
- **Accessibility** — all new text/background combinations must meet WCAG AA (4.5 : 1). Interactive elements should meet AAA (7 : 1). Check with the browser DevTools contrast checker.
- **Mobile-first** — test at 375 px width (iPhone SE viewport) before opening a PR.

---

## Commit messages

Use the conventional format:

```
feat: add cluster markers at low zoom levels
fix: close popup when map is dragged
docs: update contributing guide
chore: bump vite to 6.3
```

---

## Licence

By contributing you agree that your changes will be released under the [MIT Licence](LICENSE).
