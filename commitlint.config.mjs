// Commit-message lint rules — see CONTRIBUTING.md#commit-messages.
// Enforced locally by .husky/commit-msg and in CI by .github/workflows/commitlint.yml.
// PR titles are validated separately by .github/workflows/pr-title.yml.
export default {
  extends: ['@commitlint/config-conventional'],
  // Skip commits we don't author directly:
  // - "Merge …" = git-generated merge commits
  // - squash-merge bodies that aggregate multiple commits as bulleted
  //   conventional-commit headers (GitHub's default squash body). These
  //   routinely fail body/subject rules through no fault of the author
  //   and caused the PR #37 dev→main release to need an admin override.
  ignores: [
    (msg) => msg.startsWith('Merge '),
    (msg) => /^\* (feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: /m.test(msg),
  ],
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
      [
        'i18n', 'e2e', 'a11y', 'map', 'menu', 'dialogs', 'share', 'cache', 'overpass',
        'lint', 'build', 'deps', 'test', 'docs', 'perf', 'security', 'ci',
        // Recurring scopes observed in history — keep the warning list in sync with
        // `git log --all --format='%s' | grep -oE '^[a-z]+\(([^)]+)\)' | sort -u`.
        'adr', 'analytics', 'geocoding', 'ui', 'env', 'layout', 'styles', 'api',
        'components', 'context', 'hooks', 'lib', 'release',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-full-stop': [2, 'never', '.'],
    // 100 matches @commitlint/config-conventional's default and leaves room for the
    // `(#NN)` suffix GitHub auto-appends on squash-merge. 72 blocked every dev→main
    // PR because aggregate merge commits routinely exceed it. (PR #27.)
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 100],
  },
};
