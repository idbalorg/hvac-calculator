import { buildReferenceTraceByRoom, buildReferenceTraceForRoom } from "../engineering/reference/referenceResultIntegration.js";

const runCase = (id, name, assertion) => {
  try {
    assertion();
    return { id, name, passed: true };
  } catch (error) {
    return { id, name, passed: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export function runReferenceResultIntegrationTests() {
  const finalInputs = {
    wall: { uValueWm2K: 0.704, construction: "Steel-framed wall" },
    windows: { uValueWm2K: 5.9, shgc: 0.25, glazing: "Engineer-selected low-e glazing" },
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

  return [
    runCase("REFINT-001", "Explicit application creates a reference trace", () => {
      const trace = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference });
      if (trace?.explicitApplication !== true) throw new Error("explicit application should create a trace");
    }),
    runCase("REFINT-002", "Dataset version is preserved", () => {
      const trace = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference });
      if (trace.referenceBasis.datasetVersion !== "1.1.0") throw new Error("dataset version should be preserved");
    }),
    runCase("REFINT-003", "Source reference is preserved", () => {
      const trace = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference });
      if (trace.referenceBasis.construction.sourceRef !== "ASHRAE-90.1-2007-T5.5-1") throw new Error("source reference should be preserved");
    }),
    runCase("REFINT-004", "Final engineer value overrides applied reference", () => {
      const trace = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference });
      if (trace.engineerOverrideWins !== true) throw new Error("final engineer value should override the applied reference value");
    }),
    runCase("REFINT-005", "Final override identifies the changed field", () => {
      const trace = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference });
      if (!trace.overriddenFields.some((field) => field.label === "Window U-value" && field.finalValue === 5.9)) throw new Error("final override should identify the changed field");
    }),
    runCase("REFINT-006", "Selection without application creates no provenance", () => {
      const selectedOnly = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference: null });
      if (selectedOnly !== null) throw new Error("selection without explicit application must not create provenance");
    }),
    runCase("REFINT-007", "Applied room receives a trace", () => {
      const roomTraces = buildReferenceTraceByRoom({
        roomIds: ["ROOM-1", "ROOM-2"],
        engineeringByRoom: { "ROOM-1": finalInputs, "ROOM-2": finalInputs },
        appliedReferenceByRoom: { "ROOM-1": appliedReference },
      });
      if (roomTraces["ROOM-1"]?.explicitApplication !== true) throw new Error("applied room should have a trace");
    }),
    runCase("REFINT-008", "Un-applied room remains without a trace", () => {
      const roomTraces = buildReferenceTraceByRoom({
        roomIds: ["ROOM-1", "ROOM-2"],
        engineeringByRoom: { "ROOM-1": finalInputs, "ROOM-2": finalInputs },
        appliedReferenceByRoom: { "ROOM-1": appliedReference },
      });
      if (roomTraces["ROOM-2"] !== null) throw new Error("un-applied room should remain null");
    }),
  ];
}
