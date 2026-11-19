---
name: dispatch
description: Run one or more ready tasks from docs/work/<feature>/tasks.md from the main session: spawn the task's engineer agent, verify acceptance, commit. Use when asked to dispatch, run the next task, or continue a task list.
arguments: "[task id | PR N]"
---

# Dispatch

The main session is the dispatcher. There is no orchestrator agent. Arguments: `$ARGUMENTS` (optional task id such as `2.3`, or a PR number such as `PR 2`).

## Workflow

1. Find the task list: `docs/work/<feature>/tasks.md` for the feature in progress (the one whose branch is checked out, or the most recently changed). If more than one qualifies, ask.
2. Pick the task. With an id, use it. Without one, take the next task whose dependencies are complete, in PR order then task order. Skip tasks already marked done. If several tasks in the same PR are ready and their scopes are disjoint, dispatch them in parallel.
3. Check the branch. Each PR section names its branch and base. If the branch does not exist, create it from the base. Never dispatch onto `main`.
4. Spawn the task's agent (`backend-engineer`, `frontend-engineer` or `cleanup-engineer`, as the task names) with the task brief verbatim plus: the spec path, the PR branch, the scope list, and the instruction that it does not commit and does not touch files outside scope. One task per agent.
5. Verify after the agent reports. Do not trust the report. Run every acceptance criterion that can be run (the repo's gate from `CLAUDE.md`, plus task-specific commands) and read the files for the rest. Check `git status` against the task's scope; anything outside scope is reverted or sent back.
6. On pass: stage the task's files, commit `<type>: <description>` under 72 characters, no attribution trailers. Mark the task done in `tasks.md` in the same commit.
7. On fail: send the failures back to the same agent once with the exact command output. A second failure stops; report what failed and why, and whether it looks like a spec gap or an implementation error. Do not fix it yourself.
8. When the last task of a PR passes, push the branch and open the PR against its base with a body that leads with the problem the PR solves and lists the tasks. Do not merge.
9. When that PR is the feature's last one, close the feature out in it. `docs/work/<feature>/` is working material and does not stay on `main` after the feature merges. First list the decisions in the folder that outlive the feature and are in no ADR, runbook or rule yet, and put them to the user; write the ones they confirm at their target path (`docs/decisions/ADR-NNNN-*.md` for a decision). Then delete `docs/work/<feature>/` as the PR's last commit, and check that nothing outside the folder still cites it (`git grep docs/work/<feature>`).
10. Report: task id, commit hash, criteria checked, anything skipped.

## Rules

- Never run two tasks with overlapping scope at the same time.
- Never amend, force push, or merge.
- Never stage `.env`, credentials, or files outside the task's scope.
- If the task list is ambiguous about order or scope, stop and ask rather than guess.
- A decision the user has not explicitly agreed to is recorded as proposed, never as decided.
