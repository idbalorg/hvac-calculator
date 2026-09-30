# Stage 28 - Reference-Driven Engineering Inputs

## Objective
Move the Stage 27 reference catalog from passive lookup into a controlled input-resolution layer:

`Reference selection → calculator-ready engineering inputs → calculation`

## Delivered
- Added `referenceDrivenInputs.js` to resolve selected location, activity, ventilation, construction and fenestration records.
- Preserves reference dataset version and source records with the resolved input package.
- Maps ASHRAE ventilation reference values into L/s/person and L/s/m² inputs.
- Maps occupant activity into an explicit activity/met reference.
- Keeps missing construction and fenestration values null rather than fabricating engineering data.
- Supports explicit engineer overrides while marking that overrides were applied.
- Added reference completeness reporting.
- Added 7 Stage 28 validation tests.

## Boundary
This stage does not silently replace existing engineering inputs or calculation methods. It establishes the resolver needed for the next UI integration stage. Reference data remains subject to adopted project standards, manufacturer data and engineer verification.
