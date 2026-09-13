import { auditReferenceDataset, assertReferenceDatasetReady } from "../engineering/reference/referenceDatasetAudit.js";
import { REFERENCE_DATASET, REFERENCE_DATASET_VERSION } from "../engineering/reference/referenceDataset.js";

export const runReferenceDatasetAuditTests = () => {
  const audit = auditReferenceDataset();
  const sourcedConstructionCount = audit.categories.constructions.verifiedRecords;
  const sourcedFenestrationCount = audit.categories.fenestration.verifiedRecords;

  const customDataset = JSON.parse(JSON.stringify(REFERENCE_DATASET));
  customDataset.constructions.CUSTOM_INVALID_SOURCE = {
    id: "CUSTOM_INVALID_SOURCE",
    surfaceType: "wall",
    uValueWPerM2K: 1.0,
    sourceRef: "UNCONTROLLED_SOURCE",
    verificationRequired: true,
  };
  const customAudit = auditReferenceDataset(customDataset);

  return [
    { id: "REFAUD-001", name: "Reference dataset passes the quality gate", passed: audit.pass },
    { id: "REFAUD-002", name: "Dataset version is reported", passed: audit.datasetVersion === REFERENCE_DATASET_VERSION && audit.datasetVersion === "1.1.0" },
    { id: "REFAUD-003", name: "All required reference categories contain records", passed: Object.values(audit.categories).every((category) => category.count > 0) },
    { id: "REFAUD-004", name: "Every record has a controlled provenance reference", passed: audit.issues.every((issue) => !issue.includes("sourceRef")) },
    { id: "REFAUD-005", name: "Every record requires verification", passed: audit.issues.every((issue) => !issue.includes("verificationRequired")) },
    { id: "REFAUD-006", name: "Engineer-defined records remain visible", passed: audit.categories.constructions.engineerDefinedRecords > 0 && audit.categories.fenestration.engineerDefinedRecords > 0 },
    { id: "REFAUD-007", name: "Ready assertion returns the audit result", passed: assertReferenceDatasetReady().pass === true },
    { id: "REFAUD-008", name: "Audit reports total record count", passed: audit.recordCount >= 1 },
    { id: "REFAUD-009", name: "Construction dataset now contains sourced benchmark records", passed: sourcedConstructionCount >= 5 },
    { id: "REFAUD-010", name: "Fenestration dataset now contains sourced benchmark records", passed: sourcedFenestrationCount >= 2 },
    { id: "REFAUD-011", name: "Benchmark records are explicitly identified", passed: audit.categories.constructions.benchmarkRecords >= 5 && audit.categories.fenestration.benchmarkRecords >= 2 },
    { id: "REFAUD-012", name: "Dataset audit uses the supplied dataset rather than module globals", passed: customAudit.categories.constructions.count === audit.categories.constructions.count + 1 },
    { id: "REFAUD-013", name: "Uncontrolled source references fail the quality gate", passed: customAudit.pass === false && customAudit.issues.some((issue) => issue.includes("UNCONTROLLED_SOURCE")) },
    { id: "REFAUD-014", name: "Reference dataset exposes a controlled 90.1 source", passed: Boolean(REFERENCE_DATASET.sources.ASHRAE_90_1_2007_TABLE_5_5_1) },
    { id: "REFAUD-015", name: "Reference record count increased with Stage 31 data", passed: audit.recordCount >= 16 },
  ];
};
