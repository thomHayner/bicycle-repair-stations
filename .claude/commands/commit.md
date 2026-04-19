# Commit (Conventional Commits)

You are about to create a single commit from the staged (and, if nothing staged, the unstaged) changes in this repo. Produce a commit message that conforms to [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) — the repo enforces this via a `husky` `commit-msg` hook running `commitlint`. Non-conformant messages will be rejected.

## Process

1. Run `git status` and `git diff --staged` (or `git diff` if nothing staged) to inspect the change.
2. Run `git log --oneline -10` to match the project's commit voice.
3. **If nothing is staged**, stage the relevant files explicitly by name (do not use `git add -A` — it can sweep up secrets or unrelated work). Skip files that look like secrets (`.env*`, `*credentials*`, `*.pem`).
4. Identify the dominant intent of the change. If the diff spans multiple unrelated changes, **stop and ask the user** to split the commit.
5. Compose the message per the spec below.
6. Create the commit using a HEREDOC so newlines and footers survive shell quoting.
7. Run `git status` to confirm the commit landed.
8. If the `commit-msg` hook rejects the message: **do not amend or `--no-verify`** — re-read the hook output, fix the message, re-stage if needed, and create a NEW commit.

## Spec

Format: `<type>(<scope>)!: <subject>` followed by optional body and footers.

**Allowed types** (commitlint enforces — anything else is rejected):
`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Recommended scopes** (warning if undocumented):
`i18n`, `e2e`, `a11y`, `map`, `menu`, `dialogs`, `share`, `cache`, `overpass`, `lint`, `build`, `deps`, `test`, `docs`, `perf`, `security`, `ci`. Multi-scope OK with `+` (`fix(i18n+e2e):`).

**Subject rules**:
- Imperative mood (`add`, not `added`)
- Lowercase first letter
- No trailing period
- Total header length ≤ 100 chars (commitlint limit; leaves room for GitHub's `(#NN)` squash-merge suffix). Aim for ≤ 72 on the human-authored part.

**Body** (only when *why* isn't obvious from the diff):
- Wrap at 100 chars
- Explain *why*, not *what*

**Breaking changes**: append `!` after type/scope **and** add a `BREAKING CHANGE:` footer.

**Co-author footer**: always end with:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Example commit command

```bash
git commit -m "$(cat <<'EOF'
feat(map): debounce viewport-change handler to reduce re-renders

The previous handler fired on every Leaflet `move` event, causing the station
list to re-render dozens of times during a single drag. Debouncing at 200ms
keeps perceived responsiveness while cutting render count by ~95%.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Reference

Full spec, more examples, and rejection cases: [`CONTRIBUTING.md#commit-messages`](../../CONTRIBUTING.md#commit-messages).
