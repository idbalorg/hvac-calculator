import { buildReferenceTraceByRoom, buildReferenceTraceForRoom } from "../engineering/reference/referenceResultIntegration.js";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const appliedReference = {
  inputs: {
    wall: { uValueWm2K: 0.704, construction: "Steel-framed wall" },
    windows: { uValueWm2K: 6.814, shgc: 0.25, glazing: "Vertical glazing, metal framing" },
  },
  referenceBasis: {
    datasetVersion: "1.1.0",
    location: { id: "LAGOS_IKEJA", name: "Lagos Ikeja", sourceRef: "DESIGNCOND-LAGOS-IKEJA" },
    occupantActivity: { id: "OFFICE_TYPING", label: "Office typing", sourceRef: "ASHRAE-55-ACTIVITY" },
    ventilation: { id: "OFFICE_SPACE_62_1_2022", label: "Office space", sourceRef: "ASHRAE-62.1-2022" },
    construction: { id: "STEEL_FRAMED_WALL", sourceRef: "ASHRAE-90.1-2007-T5.5-1", benchmarkOnly: true, verificationRequired: true },
    fenestration: { id: "VERTICAL_METAL_0_40", sourceRef: "ASHRAE-90.1-2007-T5.5-1", benchmarkOnly: true, verificationRequired: true },
    appliedExplicitly: true,
    verificationRequired: true,
  },
};

export function runReferenceResultIntegrationTests() {
  let passed = 0;

  const finalInputs = {
    wall: { uValueWm2K: 0.704, construction: "Steel-framed wall" },
    windows: { uValueWm2K: 5.9, shgc: 0.25, glazing: "Engineer-selected low-e glazing" },
  };
  const trace = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference });
  assert(trace?.explicitApplication === true, "REFINT-001: explicit application should create a trace");
  passed += 1;
  assert(trace.referenceBasis.datasetVersion === "1.1.0", "REFINT-002: dataset version should be preserved");
  passed += 1;
  assert(trace.referenceBasis.construction.sourceRef === "ASHRAE-90.1-2007-T5.5-1", "REFINT-003: source reference should be preserved");
  passed += 1;
  assert(trace.engineerOverrideWins === true, "REFINT-004: final engineer value should override the applied reference value");
  passed += 1;
  assert(trace.overriddenFields.some((field) => field.label === "Window U-value" && field.finalValue === 5.9), "REFINT-005: final override should identify the changed field");
  passed += 1;

  const selectedOnly = buildReferenceTraceForRoom({
    engineeringInputs: finalInputs,
    appliedReference: null,
  });
  assert(selectedOnly === null, "REFINT-006: selection without explicit application must not create provenance");
  passed += 1;

  const roomTraces = buildReferenceTraceByRoom({
    roomIds: ["ROOM-1", "ROOM-2"],
    engineeringByRoom: { "ROOM-1": finalInputs, "ROOM-2": finalInputs },
    appliedReferenceByRoom: { "ROOM-1": appliedReference },
  });
  assert(roomTraces["ROOM-1"]?.explicitApplication === true, "REFINT-007: applied room should have a trace");
  passed += 1;
  assert(roomTraces["ROOM-2"] === null, "REFINT-008: un-applied room should remain null");
  passed += 1;

  return { passed, total: 8 };
}
