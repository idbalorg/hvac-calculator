import { buildReferenceTraceForRoom } from "../engineering/reference/referenceResultIntegration.js";
import { validateReferenceTraceIntegrity } from "../engineering/reference/referenceTraceIntegrity.js";

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

export function runReferenceTraceIntegrityTests() {
  let passed = 0;
  const finalInputs = {
    wall: { uValueWm2K: 0.704, construction: "Steel-framed wall" },
    windows: { uValueWm2K: 5.9, shgc: 0.25, glazing: "Engineer-selected low-e glazing" },
  };
  const trace = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference });

  let check = validateReferenceTraceIntegrity({ trace, appliedReference, finalInputs });
  assert(check.passed, `REFGATE-001: valid trace should pass (${check.errors.join("; ")})`);
  passed += 1;

  check = validateReferenceTraceIntegrity({ trace: null, appliedReference: null, finalInputs });
  assert(check.passed, "REFGATE-002: no applied reference should allow a null trace");
  passed += 1;

  check = validateReferenceTraceIntegrity({ trace: null, appliedReference, finalInputs });
  assert(!check.passed, "REFGATE-003: an applied reference without a trace must fail");
  passed += 1;

  const tamperedFinal = JSON.parse(JSON.stringify(finalInputs));
  tamperedFinal.windows.uValueWm2K = 4.2;
  check = validateReferenceTraceIntegrity({ trace, appliedReference, finalInputs: tamperedFinal });
  assert(!check.passed && check.errors.some((error) => error.includes("Window U-value")), "REFGATE-004: changed final input must invalidate the trace");
  passed += 1;

  const tamperedTrace = JSON.parse(JSON.stringify(trace));
  tamperedTrace.referenceBasis.datasetVersion = "0.0.0";
  check = validateReferenceTraceIntegrity({ trace: tamperedTrace, appliedReference, finalInputs });
  assert(!check.passed && check.errors.includes("Dataset version provenance mismatch"), "REFGATE-005: dataset provenance tampering must fail");
  passed += 1;

  const overrideTrace = JSON.parse(JSON.stringify(trace));
  overrideTrace.engineerOverrideWins = false;
  check = validateReferenceTraceIntegrity({ trace: overrideTrace, appliedReference, finalInputs });
  assert(!check.passed && check.errors.includes("engineerOverrideWins does not match override state"), "REFGATE-006: override state must be consistent");
  passed += 1;

  const missingFieldTrace = JSON.parse(JSON.stringify(trace));
  missingFieldTrace.fields = missingFieldTrace.fields.filter((field) => field.label !== "Window SHGC");
  check = validateReferenceTraceIntegrity({ trace: missingFieldTrace, appliedReference, finalInputs });
  assert(!check.passed && check.errors.some((error) => error.includes("Window SHGC")), "REFGATE-007: missing trace fields must fail");
  passed += 1;

  const traceBefore = JSON.stringify(trace);
  validateReferenceTraceIntegrity({ trace, appliedReference, finalInputs });
  assert(JSON.stringify(trace) === traceBefore, "REFGATE-008: integrity validation must not mutate trace data");
  passed += 1;

  return { passed, total: 8 };
}
