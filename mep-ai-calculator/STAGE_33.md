# Stage 33: Reference-Aware Calculation Report Foundation

## Objective

Carry explicit reference application and engineer overrides into calculation-result traceability without changing the numerical cooling-load engine or fabricating missing reference values.

## Delivered

- Extended `referenceCalculationBridge.js` with `buildReferenceResultTrace`.
- Reference application remains explicit. Selecting a reference alone does not mark it as applied.
- The bridge records the reference dataset version and source records already resolved by the reference dataset.
- Benchmark-only and verification-required flags are retained for report use.
- Final engineering inputs are compared with the explicitly applied reference snapshot.
- If an engineer changes an applied value, the trace records the field as overridden and the final engineer value remains authoritative.
- Missing reference values do not overwrite engineer-owned inputs.
- Added validation coverage for explicit application, override precedence, benchmark/verification provenance, and null preservation.

## Engineering boundary

This stage is traceability infrastructure. It does not reinterpret ASHRAE data, make benchmark values into Lagos defaults, or replace project-specific engineering judgement.

The cooling-load calculation remains independent of the reporting metadata. Reference metadata is attached as evidence of input basis and verification requirements.

## UI status

The existing Calculator already exposes a Reference Basis section. The trace model is now ready to replace the older resolved-reference-only display without changing the underlying calculation engine. Full UI migration is intentionally kept separate so the report cannot accidentally present a selected-but-not-applied reference as an applied engineering input.

## Validation

REFDRV-019 through REFDRV-023 cover the new Stage 33 traceability behavior. Existing REFDRV-001 through REFDRV-018 remain unchanged.
