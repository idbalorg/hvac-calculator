# Stage 39: Reference-Aware Engineering Review Gate

## Objective
Connect the controlled reference trace integrity result to the existing engineering review workflow so provenance inconsistencies become explicit review requirements before engineering approval.

## Delivered
- Added `src/engineering/review/referenceAwareEngineeringReview.js`.
- Added `buildReferenceAwareEngineeringReview()` as a non-mutating adapter around the existing engineering review engine.
- Added per-room reference review checks using the Stage 38 integrity validator.
- Preserved `NOT_REQUIRED` when no reference was explicitly applied.
- Preserved engineer-owned final inputs and existing engineering review failures as authoritative.
- Added 8 Stage 39 validation cases (`REFREV-001` to `REFREV-008`).
- Registered the Stage 39 validation group as `REFREV` in the main validation runner.

## Engineering boundary
This stage does not change cooling-load formulas, equipment sizing, psychrometric calculations, duct sizing, or reference dataset values.

It adds a review gate only. A reference integrity problem becomes `REVIEW_REQUIRED`; the adapter does not correct inputs or silently promote a benchmark to a project requirement.

## Release boundary
- Development branch only.
- Production branch untouched.
- Existing draft PR #2 remains unmerged.

## Next stage
After Stage 39 CI is confirmed, proceed to the next engineering workflow capability. Production promotion remains a separate release decision.
