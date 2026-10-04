# Project board

Do not create a second board.

zzThat already opened the org project:

https://github.com/orgs/Zero-State-LLC/projects/25

The title on that board is "zzThat board". Rename it to **zzThis + zzThat**. Keep the same project number.

This repo's token cannot read or edit GitHub Projects (v2). `organization.projectV2(number: 25)` returns null, and `createProjectV2` is forbidden. The rename, the Repo field, and adding issues are for a token that has `project` scope. The steps below are the whole change.

## Columns

Keep the columns that project 25 already has if they are already Backlog, Ready, In progress, In review, and Done.

If a column is missing, add it. Do not add a second status field. The single-select field is `Status`. Options, in order:

| Option | Meaning |
|---|---|
| Backlog | Filed, not ready to build |
| Ready | Spec and acceptance are enough to start |
| In progress | Someone is building it |
| In review | A pull request is open |
| Done | Merged, or the question is closed |

## Repo field

Add a single-select field named `Repo`.

| Option | Use |
|---|---|
| zzthis | Issues and pull requests in `Zero-State-LLC/zzthis` |
| zzthat | Issues and pull requests in `Zero-State-LLC/zzthat` |

Set `Repo` when an item is added. Do not infer it from the title.

## Automation

When a token can edit the board:

1. New issue in either repo: add the item, Status `Backlog`, Repo set from the repo.
2. Pull request opened: Status `In review`.
3. Pull request merged: Status `Done`.
4. Do not close the issue from the board alone.

`.github/workflows/project-collaboration.yml` still points at org project 24 and status `Todo`. Leave it until project 25 has the Status options above. Then set `PROJECT_NUMBER` to `25` and `STATUS_VALUE` to `Backlog`. Until then, a workflow write against 25 with status `Todo` would warn and skip the status.

## Issues to add

Add every open issue in both repos. Set Repo. Leave Status as Backlog unless the issue is already in review.

zzThis open issues at the time of this note: #6, #7, #8, #10, #11, #13, #14, #33, #34, #35, #57, #58, plus the spec 005 task-group issues filed with the design-system pull request.

zzThat open issues at the same time: #22 through #30.

Closed issues stay off the board unless someone wants history in Done.
