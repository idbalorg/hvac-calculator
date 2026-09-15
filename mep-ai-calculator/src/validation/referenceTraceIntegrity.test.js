import { buildReferenceTraceForRoom } from "../engineering/reference/referenceResultIntegration.js";
import { validateReferenceTraceIntegrity } from "../engineering/reference/referenceTraceIntegrity.js";

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

export const runReferenceTraceIntegrityTests = () => {
  const results = [];
  const check = (id, name, condition) => results.push({ id, name, passed: Boolean(condition) });
  const finalInputs = {
    wall: { uValueWm2K: 0.704, construction: "Steel-framed wall" },
    windows: { uValueWm2K: 5.9, shgc: 0.25, glazing: "Engineer-selected low-e glazing" },
  };
  const trace = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference });

  let validation = validateReferenceTraceIntegrity({ trace, appliedReference, finalInputs });
  check("REFGATE-001", "Valid trace passes integrity validation", validation.passed);
  validation = validateReferenceTraceIntegrity({ trace: null, appliedReference: null, finalInputs });
  check("REFGATE-002", "No applied reference permits a null trace", validation.passed);
  validation = validateReferenceTraceIntegrity({ trace: null, appliedReference, finalInputs });
  check("REFGATE-003", "Applied reference without trace fails validation", !validation.passed);

  const tamperedFinal = JSON.parse(JSON.stringify(finalInputs));
  tamperedFinal.windows.uValueWm2K = 4.2;
  validation = validateReferenceTraceIntegrity({ trace, appliedReference, finalInputs: tamperedFinal });
  check("REFGATE-004", "Changed final input invalidates the trace", !validation.passed && validation.errors.some((error) => error.includes("Window U-value")));

  const tamperedTrace = JSON.parse(JSON.stringify(trace));
  tamperedTrace.referenceBasis.datasetVersion = "0.0.0";
  validation = validateReferenceTraceIntegrity({ trace: tamperedTrace, appliedReference, finalInputs });
  check("REFGATE-005", "Dataset provenance tampering fails validation", !validation.passed && validation.errors.includes("Dataset version provenance mismatch"));

  const overrideTrace = JSON.parse(JSON.stringify(trace));
  overrideTrace.engineerOverrideWins = false;
  validation = validateReferenceTraceIntegrity({ trace: overrideTrace, appliedReference, finalInputs });
  check("REFGATE-006", "Override state must remain internally consistent", !validation.passed && validation.errors.includes("engineerOverrideWins does not match override state"));

  const missingFieldTrace = JSON.parse(JSON.stringify(trace));
  missingFieldTrace.fields = missingFieldTrace.fields.filter((field) => field.label !== "Window SHGC");
  validation = validateReferenceTraceIntegrity({ trace: missingFieldTrace, appliedReference, finalInputs });
  check("REFGATE-007", "Missing trace fields fail validation", !validation.passed && validation.errors.some((error) => error.includes("Window SHGC")));

  const traceBefore = JSON.stringify(trace);
  validateReferenceTraceIntegrity({ trace, appliedReference, finalInputs });
  check("REFGATE-008", "Integrity validation does not mutate trace data", JSON.stringify(trace) === traceBefore);

  return results;
};
