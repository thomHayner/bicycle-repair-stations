// Commit-message lint rules — see CONTRIBUTING.md#commit-messages.
// Enforced locally by .husky/commit-msg and in CI by .github/workflows/commitlint.yml.
// PR titles are validated separately by .github/workflows/pr-title.yml.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Closed allowlist — undocumented types are rejected.
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    // Open allowlist — undocumented scopes warn but don't block. Extend the list when a new
    // scope appears repeatedly. Multi-scope (e.g. `i18n+e2e`) is permitted by relying on warn-level.
    'scope-enum': [
      1,
      'always',
      ['i18n', 'e2e', 'a11y', 'map', 'menu', 'dialogs', 'share', 'cache', 'overpass', 'lint', 'build', 'deps', 'test', 'docs', 'perf', 'security', 'ci'],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
