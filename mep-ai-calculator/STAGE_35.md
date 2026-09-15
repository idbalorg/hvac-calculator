# Stage 35: Controlled Reference Traceability Integration

## Objective
Create a controlled adapter between explicit reference application state and the calculation/report layer.

## Delivered
- Added `src/engineering/reference/referenceResultIntegration.js`.
- Added `buildReferenceTraceForRoom()` for report-safe room trace generation.
- Added `buildReferenceTraceByRoom()` for multi-room result/report integration.
- Provenance is created only from an explicit applied-reference snapshot.
- Engineer-edited final values remain authoritative and are reported as overrides.
- Reference selection alone does not create traceability.
- Missing/un-applied references remain `null`.
- Added 8 Stage 35 integration validation cases (`REFINT-001` to `REFINT-008`).

## Engineering boundary
This stage does not change cooling-load mathematics. It only prepares the controlled data path needed by the existing `ReferenceTraceabilityPanel`.

The existing `Calculator.jsx` still requires a targeted UI wiring step so its room state can retain the explicit applied-reference snapshot and pass the resulting trace into the report panel. No whole-file rewrite was performed.

## Release boundary
- Development branch only.
- Production branch untouched.
- Existing draft PR #2 remains unmerged.
