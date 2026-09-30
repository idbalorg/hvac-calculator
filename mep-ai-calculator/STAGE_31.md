# Stage 31: Authoritative Envelope Reference Expansion

Stage 31 expands the engineering reference layer with sourced envelope benchmark records and hardens provenance auditing.

## Delivered
- Added ASHRAE 90.1-2007 Table 5.5-1 source metadata.
- Added nonresidential Climate Zone 1 (A, B) opaque-envelope benchmark U-values for mass walls, steel-framed walls, wood-framed/other walls, above-deck roofs, and attic/other roofs.
- Added vertical glazing benchmark records for nonmetal and metal framing at 0%-40% of wall area.
- Preserved missing fenestration SHGC as `null` where the available source extract does not support a safe value.
- Marked sourced envelope records as `benchmarkOnly` so they are not treated as Lagos project defaults.
- Kept engineer-defined construction and fenestration starters available for project-specific values.
- Hardened the dataset audit so supplied datasets are audited directly and uncontrolled provenance references fail the quality gate.
- Added 15 validation checks covering source control, benchmark classification, custom-dataset auditing and record growth.

## Engineering Basis
The numeric envelope benchmarks are transcribed from the uploaded ANSI/ASHRAE/IESNA Standard 90.1-2007 material, Table 5.5-1, Climate Zone 1 (A, B), nonresidential column. Values are converted from the table's IP U-factor values to SI U-values for the application data model.

These records are reference benchmarks, not a claim that Lagos belongs to ASHRAE Climate Zone 1 or that the values are automatically appropriate for a Lagos project.

## Boundary
The reference dataset supplies traceable starting points only. Project envelope selections remain engineer-controlled and must be checked against the adopted code/standard edition, actual construction assembly, manufacturer/test data where applicable, project location and project requirements.
