# Stage 36: Controlled Reference Traceability Integration

## Objective
Wire the explicit reference application state into the existing Calculator result/report layer without changing cooling-load mathematics.

## Delivered
- Calculator now imports the reference bridge and Stage 35 integration adapter.
- Added per-room `appliedReferenceByRoom` state.
- Clicking **Apply Reference Inputs** stores the exact applied reference snapshot.
- Calculator results now build `referenceTraceByRoom` from the explicit applied snapshot and final engineering inputs.
- Existing `ReferenceTraceabilityPanel` is rendered in the Reference Basis result section.
- Engineer edits after application remain authoritative and are surfaced as overrides.
- Saving a project now preserves the applied reference snapshot.
- Removing a room clears its applied reference state.
- Registered Stage 35 integration validation in the main validation runner.
- No cooling-load calculation formulas were changed.

## Engineering boundary
Reference selection alone does not create provenance. A room receives an Applied trace only after the user explicitly applies its reference inputs. Final engineer-owned values remain authoritative.

## Release boundary
- Development branch only.
- Production branch untouched.
- Existing draft PR #2 remains unmerged.
