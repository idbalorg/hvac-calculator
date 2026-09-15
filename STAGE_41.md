# Stage 41: Reference-Aware Engineering Approval Gate

## Objective
Connect the Stage 40 unified engineering decision output to the existing explicit engineering approval gate without changing engineering calculations or silently resolving exceptions.

## Scope
- Pass the Stage 40 engineering decision into the approval gate.
- Preserve critical and review-required exceptions as unresolved until explicitly resolved or documented with a valid override.
- Preserve accountable approver, reason, evidence reference, and timestamp requirements.
- Keep approval workflow state separate from engineering calculations and decision evidence.
- Add regression validation for clean approval, unresolved reference exceptions, explicit overrides, critical blocking, invalid overrides, and input immutability.

## Boundary
Approval is a workflow action. It is not a code-compliance certification, construction authorization, or replacement for engineer-of-record responsibility.

## Validation
Stage 41 must pass the full engineering validation gate before it is considered complete and before any production promotion.

## Production
Production remains untouched by Stage 41.
