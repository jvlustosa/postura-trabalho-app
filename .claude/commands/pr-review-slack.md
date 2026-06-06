Generate a Slack PR review message for the current branch in THIS repository.

## What to do

1. Run `git log main..HEAD --oneline` and `git diff main...HEAD --stat` to understand the full scope of changes on this branch.
2. Read the changed files to understand what was built/fixed and why.
3. Check if tests were added — count them and note coverage areas.
4. Generate a Slack message following the exact format below.

## Output format

Output ONLY the Slack message text inside a code block (for easy copy-paste). No commentary before or after.

```
#PR Review: <Concise Title in Portuguese>
Frontend: <branch-name> (<GitHub PR URL>)

Problema Resolvido — <1-3 sentences: what was broken or missing, and why it mattered to users>
[Causa Raiz — <1-2 sentences if root cause is non-obvious>]
<Change Area 1> — <what changed and the key technical detail, one line>
<Change Area 2> — <what changed and the key technical detail, one line>
...
[Testes — <N> testes passando (<brief coverage areas>).]
Dev: @Vitor
QA: @Concli — Testar:
1) <manual test step>
2) <manual test step>
...
[Nota: <any prerequisites, migrations, deploy notes>]
```

## Format rules

- Language: Portuguese (pt-BR) throughout
- Title: descriptive, under ~60 chars
- `Problema Resolvido —` is ALWAYS the first paragraph. Em dash (—), not hyphen
- Section titles: plain text + ` — ` + description. One line each
- QA steps: numbered with `)` not `.`. Specific, actionable, with expected outcome
- Keep scannable: 15-30 lines
- Infer PR URL via `gh pr list --head <branch-name>` or use compare URL as fallback

$ARGUMENTS
