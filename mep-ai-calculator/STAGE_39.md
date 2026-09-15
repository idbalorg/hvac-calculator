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

## Validation status
Stage 39 is validation-complete on the development branch.

CI run `34934215125` passed:
- Engineering validation: **394/394 PASS**
- `REFREV-001` through `REFREV-008`: **8/8 PASS**
- Production build: **PASS**

The first CI attempt failed only because the new adapter imported `referenceTraceIntegrity.js` from the wrong directory. The import path was corrected, and the subsequent CI run passed the full suite.

## Next stage
Proceed to Stage 40 only after treating this Stage 39 implementation as the current development baseline. Production promotion remains a separate release decision.
