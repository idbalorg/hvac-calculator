# Stage 46: Production Branch Reconciliation

## Objective

Establish a controlled integration path between the current production branch and the Stage 45 engineering/release-control line without merging or modifying production.

## Reconciliation Snapshot

- Production branch: `production`
- Engineering branch: `stage45-production-release-workflow`
- Common merge base: `ea7d4a3821409e366952d1a77a0686a26789437d`
- Production head: `8c25d76e887d096dab38e34945a5163a58c10134`
- Stage 45 contains 237 commits after the common merge base.
- The branch comparison reports production and Stage 45 as diverged: Stage 45 is 237 commits ahead and 18 commits behind production.

## What This Means

Production must not be replaced wholesale by Stage 45.

The Stage 45 line contains the accumulated engineering work from the common merge base through the release-control stages, including:

1. Engineering validation and governance
2. Reference-data traceability
3. Engineering review, decision and approval
4. Approved revision control
5. Release-candidate control
6. Production-promotion gating
7. Manual production-release workflow

Production also contains its own post-baseline history. The recent production history includes corrective/cleanup commits such as removal of accidental files and protection of the production branch from unintended Stage 38 documentation.

These histories must be preserved as separate concerns until their compatibility is explicitly verified.

## Controlled Integration Strategy

### 1. Preserve production

This Stage 46 branch is created directly from `production`.

No force push, reset, merge, rebase, or direct production modification is performed by this stage.

### 2. Treat Stage 45 as the engineering candidate line

Stage 45 remains the source of the newer engineering governance and release-control implementation.

It is not treated as an automatically deployable replacement for production.

### 3. Reconcile by engineering capability, not by commit count

The next integration work should classify Stage 45 changes into:

- Core calculation-engine changes
- UI/application changes
- Validation and regression tests
- Engineering reference/traceability changes
- Release/revision governance
- GitHub workflow changes
- Stage documentation and temporary marker files

Each category should be checked against the current production implementation before integration.

### 4. Protect production-specific history

Production-only changes must be reviewed before integration. Cleanup commits must not be blindly replayed onto the engineering line, and engineering-stage documentation or marker files must not be introduced into production merely because they exist on the Stage 45 branch.

### 5. Integrate through a reviewable branch

Any actual integration should occur on a separate branch derived from the current production head. The integration branch should pass:

- full validation suite
- production build
- lint
- UI smoke testing
- critical cooling-load regression cases
- release-control regression tests
- exact production-commit verification

Only after those checks pass should a pull request to `production` be considered.

## Current Decision

**Do not merge Stage 45 into production at Stage 46.**

The branch histories are materially divergent, and the current comparison is too broad for a safe blind merge.

Stage 46 therefore establishes the reconciliation boundary and preserves production while the integration surface is reviewed.

## Production Safety

Production remains untouched by Stage 46.

No production deployment or promotion has been performed.

## Next Stage

Stage 47 should perform the first controlled integration slice from the Stage 45 line into a production-derived integration branch, beginning with the non-destructive engineering governance and validation infrastructure before application/UI changes.

The integration should be incremental and test-gated rather than a single wholesale merge.
