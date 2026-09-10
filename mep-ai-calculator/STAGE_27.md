# Stage 27 - Engineering Reference Dataset

## Objective
Create a controlled reference-data layer so the workflow can move toward:

`Location → Design condition → Construction → Internal loads → Solar → Ventilation → Calculation`

## Delivered
- Versioned reference dataset (`1.0.0`).
- Source/provenance metadata on every reference record.
- Lagos Ikeja linked to the existing ASHRAE 2021 design-condition record.
- ASHRAE 55-2017 occupant activity references for common office activities.
- ASHRAE 62.1-2022 ventilation references for office, reception and conference/meeting spaces.
- Engineer-defined construction and fenestration starter records intentionally leave U-value/SHGC blank instead of inventing project data.
- Design-condition results now carry the reference dataset version and location provenance.
- Reference Data page added at `/reference-data`.
- Validation coverage added under the `REF` group.

## Engineering boundary
The dataset is a reference layer, not a compliance engine. Adopted project codes, licensed standard tables, manufacturer data, site conditions and engineer judgement remain authoritative.

Values sourced from the project-provided ASHRAE documents are identified by source references. Where the project does not yet have authoritative construction/fenestration data, the implementation does not fabricate values.
