# Stage 29: Reference-Driven Calculator UI

Stage 29 integrates the Stage 28 reference resolver into the main cooling-load calculator.

## Delivered
- Room-level location, occupant activity, ventilation basis, wall construction, and fenestration selectors.
- Explicit `Apply Reference Inputs` action before reference values modify engineering inputs.
- Reference provenance and dataset version shown beside the room inputs.
- Missing construction/fenestration values remain engineer-defined rather than fabricated.
- Selected location can drive the project outdoor design-condition record.
- Selected ventilation reference enables the room ventilation load and populates its outdoor-air basis.
- Reference selections are persisted with saved projects.

## Engineering boundary
The reference catalog remains a controlled starter dataset. It does not replace adopted project requirements, licensed standard tables, manufacturer data, or engineer verification.
