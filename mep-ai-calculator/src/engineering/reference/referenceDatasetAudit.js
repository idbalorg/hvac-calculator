/** Stage 30: reference dataset quality gate. */
import {
  REFERENCE_DATASET,
  REFERENCE_DATASET_VERSION,
  REFERENCE_SOURCES,
  listReferenceRecords,
} from "./referenceDataset.js";

const REQUIRED_CATEGORIES = ["locations", "occupantActivities", "ventilation", "constructions", "fenestration"];

export const auditReferenceDataset = (dataset = REFERENCE_DATASET) => {
  const issues = [];
  const warnings = [];
  const categoryStats = {};

  if (!dataset.version) issues.push("Dataset version is required.");
  if (dataset.version !== REFERENCE_DATASET_VERSION) warnings.push(`Runtime dataset version ${dataset.version} differs from module version ${REFERENCE_DATASET_VERSION}.`);

  REQUIRED_CATEGORIES.forEach((category) => {
    const records = dataset[category] && typeof dataset[category] === "object" ? Object.values(dataset[category]) : [];
    categoryStats[category] = { count: records.length, verifiedRecords: 0, engineerDefinedRecords: 0 };
    if (!records.length) issues.push(`Reference category ${category} is empty.`);
    records.forEach((record) => {
      if (!record.id) issues.push(`${category}: record id is missing.`);
      if (!record.sourceRef) issues.push(`${category}/${record.id}: sourceRef is missing.`);
      if (record.verificationRequired !== true) issues.push(`${category}/${record.id}: verificationRequired must be true.`);
      if (record.sourceRef === "ENGINEER_DEFINED_STARTER") categoryStats[category].engineerDefinedRecords += 1;
      else categoryStats[category].verifiedRecords += 1;
    });
  });

  Object.values(REFERENCE_SOURCES).forEach((source) => {
    if (source.verificationRequired !== true) issues.push(`Source ${source.id} must require verification.`);
  });

  const allRecords = REQUIRED_CATEGORIES.flatMap((category) => listReferenceRecords(category));
  const sourceIds = new Set(Object.keys(REFERENCE_SOURCES));
  allRecords.forEach((record) => {
    if (record.sourceRef && record.sourceRef.includes("ASHRAE") && !record.sourceRef.startsWith("ASHRAE_")) {
      warnings.push(`${record.id}: sourceRef format should use the controlled ASHRAE source identifier.`);
    }
  });

  return {
    pass: issues.length === 0,
    datasetVersion: dataset.version,
    categories: categoryStats,
    recordCount: allRecords.length,
    issues,
    warnings,
    controlledSourceCount: sourceIds.size,
  };
};

export const assertReferenceDatasetReady = (dataset = REFERENCE_DATASET) => {
  const audit = auditReferenceDataset(dataset);
  if (!audit.pass) throw new Error(`Reference dataset audit failed: ${audit.issues.join(" | ")}`);
  return audit;
};
