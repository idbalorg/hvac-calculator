# Stage 38: Reference Trace Integrity Gate

## Objective
Add a deterministic integrity gate for the controlled reference traceability path so report provenance cannot silently drift from the explicitly applied reference snapshot or final engineer-owned inputs.

## Delivered
- Added `src/engineering/reference/referenceTraceIntegrity.js`.
- Added `validateReferenceTraceIntegrity()` to verify:
  - explicit reference application state
  - verification-required metadata
  - reference and final engineering values
  - engineer override flags and override list
  - dataset version provenance
  - location, occupant activity and ventilation provenance
  - missing trace detection when a reference was applied
  - null trace acceptance when no reference was applied
- Added 8 Stage 38 validation cases (`REFGATE-001` to `REFGATE-008`).
- Registered the Stage 38 integrity tests in the main validation runner as `REFGATE`.

## Engineering boundary
This stage does not change cooling-load formulas, equipment sizing, psychrometric calculations, or reference dataset values. It validates the consistency of the existing reference application and result trace only.

The integrity validator is deliberately non-mutating. A failed check identifies a trace/provenance inconsistency; it does not silently correct engineering inputs.

## Release boundary
- Development branch only.
- Production branch untouched.
- Existing draft PR #2 remains unmerged.

## Next stage
Proceed to the next engineering capability only after the Stage 38 validation result and CI status are confirmed.
