Conduct a thorough, production-readiness code review of a branch in THIS repository.

This is the single-repo version — it reviews only the current project.

## Input parsing

Parse from `$ARGUMENTS`:

**Required:**
- **Branch name**: The branch to review

**Optional:**
- Free-text directions or focus areas
- `--quorum` flag: Full quorum-grade review (70+ KB, live DB verification)
- `--light` flag: Lighter review (PR_REVIEW format, 6-10 KB)
- Default: Standard CODE_REVIEW format (15-25 KB)

## Execution

### Phase 0: Setup

1. `git fetch origin`
2. Create a review worktree:
   ```bash
   git worktree add ../<RepoName>-review-<branch_short> origin/<branch_name>
   ```
3. Inside worktree, merge main:
   ```bash
   git merge origin/main --no-edit
   ```
   If conflicts arise, STOP and report them.
4. For Node.js repos: `source "$HOME/.nvm/nvm.sh" && nvm use`
5. For Python repos: verify virtualenv

### Phase 1: Scope

1. `git log origin/main..HEAD --oneline`
2. `git diff origin/main...HEAD --stat`
3. `git diff origin/main...HEAD --shortstat`
4. Categorize: SQL migrations, Source code, Tests, Types/Generated, Docs, Config

### Phase 2: Full diff review

Read EVERY changed file end-to-end. Review checklist:
1. Correctness — edge cases, race conditions, off-by-one
2. Security — injection, auth bypass, data exposure, secrets
3. Architecture — boundaries, separation of concerns, existing patterns
4. Maintainability — readability, naming, SRP, DRY
5. Performance — N+1 queries, loops, memory leaks, indexes
6. Error handling — graceful failures, meaningful messages
7. Testing — coverage, behavior-driven, edge cases

### Phase 3: Automated verification

Node.js:
```bash
source "$HOME/.nvm/nvm.sh" && nvm use
npm run lint 2>&1 | tail -30
npm test -- --passWithNoTests 2>&1 | tail -30
```

Python:
```bash
python -m pytest --tb=short 2>&1 | tail -30
```

Security greps:
```bash
git diff origin/main...HEAD --name-only | xargs grep -n -E '(eval\(|dangerouslySetInnerHTML|innerHTML\s*=|document\.write|\.exec\(|as any|@ts-ignore|@ts-nocheck)' 2>/dev/null
```

### Phase 4: Generate review

Write to `docs/code-reviews/` in the worktree. Use the standard CODE_REVIEW template with sections: Executive Summary, Scope & Method, Blocking Findings, Non-Blocking Findings (P1-P3), Positive Signals, Verification Performed, Remediation Plan, Manual QA Checklist, Deploy Notes, Changed Files.

**Filename:** `CODE_REVIEW_<BRANCH_UPPER>.md` | `PR_REVIEW_<branch>.md` | `CODE_REVIEW_<BRANCH_UPPER>_QUORUM.md`

### After review

1. Report the file path
2. Ask if user wants to commit it
3. If blocking findings, offer to create a fix plan

$ARGUMENTS
