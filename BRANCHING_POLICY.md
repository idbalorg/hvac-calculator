# Branching Policy

This repository uses only two active branches:

- `development`: all normal engineering work, fixes, tests, and feature development happen here.
- `production`: deployment/release branch only.

## Workflow

1. Work on `development`.
2. Validate the completed milestone on `development`.
3. Promote the approved state to `production`.
4. Deploy from `production`.
5. Do not develop directly on `production`.

Historical `stage*`, `milestone*`, `engineering-core*`, and temporary fix branches are not part of the normal workflow and should be removed after confirming that no recovery is required.

## Release rule

Development changes must not automatically deploy to production. Production changes happen only through an intentional promotion/release step after validation.
