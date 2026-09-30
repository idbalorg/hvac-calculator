import { buildStandardsTraceability, ENGINEERING_BASIS } from "../engineering/standards/standardsTraceability.js";

export const runStandardsTraceabilityTests = () => {
  const tests = [];
  const result = buildStandardsTraceability({
    rooms: [{ roomId: "R1", supplyAirflowCfm: 500, outdoorAirflowCfm: 80 }],
    equipment: [{ equipmentId: "AC-01", type: "SPLIT_DX", refrigerant: "R-32" }],
    ducts: [{ ductId: "D-01" }],
    projectCriteria: { ventilationRequired: true, commissioningRequired: true },
    systemSummary: { systemId: "SYS-01" },
  });

  const ids = result.traceability.map((row) => row.id);
  for (const id of ["LOAD-001", "COND-001", "ENV-001", "PSY-001", "EQUIP-001", "VENT-001", "AIR-001", "DUCT-001", "REF-001", "TEST-001"]) {
    if (!ids.includes(id)) throw new Error(`Missing traceability basis ${id}`);
  }
  tests.push({ id: "TRACE-001", name: "Core engineering basis coverage", passed: true });

  const load = result.traceability.find((row) => row.id === ENGINEERING_BASIS.COOLING_LOAD.id);
  if (!load.method || !load.reference || !load.verification || load.status !== "BASIS_RECORDED") throw new Error("Cooling-load traceability is incomplete");
  tests.push({ id: "TRACE-002", name: "Input-method-reference-verification chain", passed: true });

  const direct = buildStandardsTraceability({
    rooms: [{ roomId: "R1", supplyAirflowCfm: 400 }],
    equipment: [{ equipmentId: "AC-01", type: "SPLIT_DX" }],
    ducts: [],
    projectCriteria: {},
  });
  if (direct.traceability.some((row) => row.id === "DUCT-001")) throw new Error("Direct-discharge case incorrectly requires duct-design basis");
  tests.push({ id: "TRACE-003", name: "System-aware duct traceability", passed: true });

  if (!result.disclaimer || !result.methodology.includes("Input") || !result.methodology.includes("Verification")) throw new Error("Traceability metadata is incomplete");
  tests.push({ id: "TRACE-004", name: "Traceability metadata", passed: true });

  return tests;
};
