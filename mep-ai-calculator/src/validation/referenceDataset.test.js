import { buildProjectDesignConditions } from "../engineering/project/designConditions.js";
import {
  REFERENCE_DATASET_VERSION,
  listReferenceRecords,
  getReferenceRecord,
  resolveVentilationReference,
  resolveOccupantActivityReference,
  buildReferenceSelection,
  validateReferenceRecord,
} from "../engineering/reference/referenceDataset.js";

const expectThrow = (fn, message) => {
  let threw = false;
  try { fn(); } catch (error) { threw = true; if (message && !String(error.message).includes(message)) throw new Error(`Expected error containing '${message}', got '${error.message}'`); }
  if (!threw) throw new Error("Expected function to throw");
};

export const runReferenceDatasetTests = () => [
  { id: "REF-001", name: "Reference dataset has a version", passed: /^\d+\.\d+\.\d+$/.test(REFERENCE_DATASET_VERSION) },
  { id: "REF-002", name: "Lagos location resolves to existing design condition", passed: getReferenceRecord("locations", "LAGOS_IKEJA").designConditionId === "LAGOS_IKEJA_ASHRAE_2021" },
  { id: "REF-003", name: "Office ventilation reference matches source table values", passed: (() => { const item = resolveVentilationReference("OFFICE_SPACE_62_1_2022"); return item.peopleOutdoorAirCfmPerPerson === 5 && item.areaOutdoorAirCfmPerFt2 === 0.06 && item.defaultOccupantDensityPer100M2 === 5 && item.airClass === 1; })() },
  { id: "REF-004", name: "Occupant activity reference resolves", passed: resolveOccupantActivityReference("OFFICE_TYPING").met === 1.1 },
  { id: "REF-005", name: "Reference selection preserves provenance", passed: (() => { const selection = buildReferenceSelection({ locationId: "LAGOS_IKEJA", occupancyActivityId: "OFFICE_TYPING", ventilationId: "OFFICE_SPACE_62_1_2022" }); return selection.ventilation.sourceRef === "ASHRAE_62_1_2022_TABLE_6_1" && selection.occupantActivity.sourceRef === "ASHRAE_55_2017_TABLE_5_2_1_2"; })() },
  { id: "REF-006", name: "Engineer-defined starter values remain verification-required", passed: getReferenceRecord("constructions", "ENGINEER_DEFINED_MASONRY_WALL").verificationRequired === true && getReferenceRecord("constructions", "ENGINEER_DEFINED_MASONRY_WALL").uValueWPerM2K === null },
  { id: "REF-007", name: "Unknown reference is rejected", passed: (() => { expectThrow(() => getReferenceRecord("ventilation", "UNKNOWN"), "Unknown ventilation reference"); return true; })() },
  { id: "REF-008", name: "Invalid reference provenance is rejected", passed: (() => { expectThrow(() => validateReferenceRecord({ id: "BAD", sourceRef: "x", verificationRequired: false }), "must require verification"); return true; })() },
  { id: "REF-009", name: "Reference lists are cloned", passed: (() => { const items = listReferenceRecords("ventilation"); items[0].label = "Changed"; return listReferenceRecords("ventilation")[0].label !== "Changed"; })() },
  { id: "REF-010", name: "Design-condition calculation carries dataset provenance", passed: (() => { const result = buildProjectDesignConditions({ outdoorConditionId: "LAGOS_IKEJA_ASHRAE_2021", coolingPercentile: "percentile04", outdoorRelativeHumidityPercent: 75 }); return result.referenceData.datasetVersion === REFERENCE_DATASET_VERSION && result.referenceData.location.designConditionId === "LAGOS_IKEJA_ASHRAE_2021"; })() },
];
