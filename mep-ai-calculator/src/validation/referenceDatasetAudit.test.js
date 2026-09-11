import { auditReferenceDataset, assertReferenceDatasetReady } from "../engineering/reference/referenceDatasetAudit.js";

export const runReferenceDatasetAuditTests = () => [
  { id: "REFAUD-001", name: "Reference dataset passes the quality gate", passed: auditReferenceDataset().pass },
  { id: "REFAUD-002", name: "Dataset version is reported", passed: auditReferenceDataset().datasetVersion === "1.0.0" },
  { id: "REFAUD-003", name: "All required reference categories contain records", passed: Object.values(auditReferenceDataset().categories).every((category) => category.count > 0) },
  { id: "REFAUD-004", name: "Every record has a provenance reference", passed: auditReferenceDataset().issues.every((issue) => !issue.includes("sourceRef")) },
  { id: "REFAUD-005", name: "Every record requires verification", passed: auditReferenceDataset().issues.every((issue) => !issue.includes("verificationRequired")) },
  { id: "REFAUD-006", name: "Engineer-defined records remain visible", passed: auditReferenceDataset().categories.constructions.engineerDefinedRecords > 0 && auditReferenceDataset().categories.fenestration.engineerDefinedRecords > 0 },
  { id: "REFAUD-007", name: "Ready assertion returns the audit result", passed: assertReferenceDatasetReady().pass === true },
  { id: "REFAUD-008", name: "Audit reports total record count", passed: auditReferenceDataset().recordCount >= 1 },
];
