# Stage 32: Reference-to-Calculation Integration

## Objective
Move the engineering reference dataset beyond a display/reference layer by providing an explicit, testable bridge from selected reference records into cooling-load engineering inputs.

## Delivered
- Added `referenceCalculationBridge.js`.
- Added explicit application of sourced wall U-values into engineering inputs.
- Added explicit application of sourced fenestration U-value and SHGC into engineering inputs.
- Missing reference properties remain non-destructive: an unavailable value does not overwrite an existing engineer-defined value.
- Preserved reference provenance separately from numerical engineering inputs.
- Preserved dataset version and verification requirement in the reference basis.
- Added regression tests showing sourced wall and fenestration values affect cooling-load calculations.
- Confirmed manual engineering inputs remain usable without references.

## Engineering Flow
Reference selection
→ resolved reference record
→ explicit reference application
→ engineering input value
→ cooling-load component calculation
→ result
→ reference basis / verification requirement

## Important Boundary
Reference application is explicit. Benchmark records are never silently applied merely because they exist in the reference dataset.

A missing reference property is not converted into an arbitrary engineering default by the bridge.

The Stage 31 envelope values remain benchmark records and are not asserted to be Lagos project defaults.

## Current Integration Boundary
The bridge is now available as a deterministic engineering module. The existing Calculator page already has reference selection and application logic; a later UI-focused stage should consolidate that page logic onto this bridge and expose the resulting provenance directly in the user-facing calculation report.

## Validation
Stage 32 extends the reference-driven validation suite with end-to-end wall/fenestration calculation checks, provenance checks, missing-value protection and manual-input regression coverage.
