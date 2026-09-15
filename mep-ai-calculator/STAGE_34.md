# Stage 34: Reference-Aware Report UI Foundation

## Objective
Provide a report-safe presentation layer for explicit reference application, provenance, benchmark status, verification requirements, and engineer overrides.

## Delivered

- Added `ReferenceTraceabilityPanel.jsx`.
- The panel distinguishes an explicitly applied reference basis from a merely selected reference.
- Displays dataset version, location, occupant activity, ventilation, construction, and fenestration reference records.
- Displays source references where available.
- Preserves benchmark-only wording so benchmark records are not presented as Lagos defaults.
- Displays project-specific verification requirements.
- Displays engineer overrides and the final engineer-owned value.
- Added `REFUI-001` through `REFUI-006` validation coverage.

## Integration boundary

The existing Calculator page is large and its current source representation is not safely patchable in a small targeted update. This stage therefore adds the reusable report component and validation foundation without replacing the Calculator page wholesale.

The component is ready for the next controlled Calculator integration step. No production branch changes were made.

## Engineering boundary

This UI does not create engineering values. It only presents the traceability state produced by the Stage 33 reference bridge. Benchmark records remain benchmark-only and require project-specific verification.
