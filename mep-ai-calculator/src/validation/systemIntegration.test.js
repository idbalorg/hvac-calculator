import {
  buildSystemSummary,
  calculateSystemRequirements,
  reconcileSystemAirflows,
  validateSystemSelection,
} from "../engineering/airside/systemIntegration.js";

const approx = (actual, expected, tolerance = 1e-9) => Math.abs(actual - expected) <= tolerance;
const pass = (id, name) => ({ id, name, passed: true });
const expectThrows = (fn) => {
  try { fn(); return false; } catch { return true; }
};

export const runSystemIntegrationTests = () => {
  const tests = [];

  const airflow = reconcileSystemAirflows({
    terminalAirflowsCfm: [500, 300, 200],
    outdoorAirflowCfm: 250,
    transferAirflowCfm: 100,
  });
  if (airflow.supplyAirflowCfm !== 1000 || airflow.returnAirflowCfm !== 900 || airflow.recirculatedAirflowCfm !== 650) {
    throw new Error("System airflow reconciliation failed");
  }
  tests.push(pass("UNIT-SYS-001", "System airflow reconciliation"));

  const requirements = calculateSystemRequirements({
    roomLoadsKw: [4, 3, 2],
    roomAirflowsCfm: [500, 300, 200],
    criticalPathPressureLossPa: 180,
    terminalPressureDropPa: 50,
    coilPressureDropPa: 80,
    filterPressureDropPa: 40,
    damperPressureDropPa: 20,
    otherPressureDropsPa: [10, 5],
    safetyFactor: 0.1,
    capacityMargin: 0.1,
  });
  if (
    !approx(requirements.roomLoadKw, 9) ||
    !approx(requirements.designCapacityKw, 9.9) ||
    requirements.supplyAirflowCfm !== 1000 ||
    !approx(requirements.baseFanEspPa, 385) ||
    !approx(requirements.requiredFanEspPa, 423.5)
  ) throw new Error("System requirements calculation failed");
  tests.push(pass("UNIT-SYS-002", "System capacity, airflow and ESP requirements"));

  const valid = validateSystemSelection({
    requiredCapacityKw: 9.9,
    selectedCapacityKw: 10.5,
    requiredAirflowCfm: 1000,
    selectedAirflowCfm: 1050,
    requiredFanEspPa: 423.5,
    selectedFanEspPa: 450,
    maxOversizeFraction: 0.15,
  });
  if (!valid.passed || !valid.capacityPass || !valid.airflowPass || !valid.espPass) {
    throw new Error("Valid system selection was rejected");
  }
  tests.push(pass("UNIT-SYS-003", "System equipment selection pass"));

  const undersized = validateSystemSelection({
    requiredCapacityKw: 10,
    selectedCapacityKw: 8,
    requiredAirflowCfm: 1000,
    selectedAirflowCfm: 900,
    requiredFanEspPa: 400,
    selectedFanEspPa: 350,
  });
  if (undersized.passed || undersized.capacityPass || undersized.airflowPass || undersized.espPass) {
    throw new Error("Undersized system selection was incorrectly accepted");
  }
  tests.push(pass("UNIT-SYS-004", "System equipment undersizing check"));

  const oversized = validateSystemSelection({
    requiredCapacityKw: 10,
    selectedCapacityKw: 12,
    requiredAirflowCfm: 1000,
    selectedAirflowCfm: 1000,
    requiredFanEspPa: 400,
    selectedFanEspPa: 400,
    maxOversizeFraction: 0.15,
  });
  if (oversized.passed || oversized.capacityPass) throw new Error("Excessive equipment oversizing was incorrectly accepted");
  tests.push(pass("UNIT-SYS-005", "Maximum equipment oversize check"));

  const summary = buildSystemSummary({
    systemId: "SYS-01",
    systemType: "Split DX",
    requirements,
    selection: valid,
  });
  if (summary.status !== "PASS" || summary.systemId !== "SYS-01" || summary.systemType !== "Split DX") {
    throw new Error("System summary failed");
  }
  tests.push(pass("UNIT-SYS-006", "Integrated system summary"));

  if (!expectThrows(() => reconcileSystemAirflows({ terminalAirflowsCfm: [] }))) throw new Error("Empty terminal airflow was not rejected");
  if (!expectThrows(() => calculateSystemRequirements({ roomLoadsKw: [1], roomAirflowsCfm: [100], criticalPathPressureLossPa: -1 }))) throw new Error("Negative critical pressure was not rejected");
  if (!expectThrows(() => buildSystemSummary({ systemId: "", systemType: "DX", requirements, selection: valid }))) throw new Error("Invalid system ID was not rejected");
  tests.push(pass("UNIT-SYS-007", "System integration input validation"));

  return tests;
};
