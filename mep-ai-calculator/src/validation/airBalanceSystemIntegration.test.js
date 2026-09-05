import { integrateAirBalancingAndSystem, summarizeStage16 } from "../engineering/airside/airBalanceSystemIntegration.js";

const approx = (actual, expected, tolerance = 1e-9) => Math.abs(actual - expected) <= tolerance;
const pass = (id, name, details = {}) => ({ id, name, passed: true, details });
const expectThrows = (fn) => { try { fn(); return false; } catch { return true; } };

const baseInput = {
  terminals: [
    { id: "T1", roomId: "Office A", designAirflowCfm: 400, measuredAirflowCfm: 400 },
    { id: "T2", roomId: "Office B", designAirflowCfm: 300, measuredAirflowCfm: 300 },
  ],
  branchPressureLossesPa: [
    { id: "B1", pressureLossPa: 120 },
    { id: "B2", pressureLossPa: 95 },
  ],
  tolerancePercent: 10,
  roomLoadsKw: [5, 3],
  roomAirflowsCfm: [400, 300],
  outdoorAirflowCfm: 70,
  transferAirflowCfm: 20,
  criticalPathPressureLossPa: 180,
  terminalPressureDropPa: 30,
  coilPressureDropPa: 80,
  filterPressureDropPa: 40,
  damperPressureDropPa: 20,
  otherPressureDropsPa: [10],
  espSafetyFactor: 0.1,
  capacityMargin: 0.1,
  selectedCapacityKw: 9,
  selectedAirflowCfm: 800,
  selectedFanEspPa: 440,
  maxOversizeFraction: 0.2,
};

export const runAirBalanceSystemIntegrationTests = () => {
  const tests = [];
  const result = integrateAirBalancingAndSystem(baseInput);

  if (result.balanceReport.summary.total !== 2 || result.balanceReport.summary.balancedCount !== 2) {
    throw new Error("Terminal balance integration failed");
  }
  tests.push(pass("SYSBAL-001", "Terminal balance integration"));

  if (result.branchBalancing.criticalBranchId !== "B1" || result.branchBalancing.branches.find((b) => b.id === "B2")?.balancingDamperPressureDropPa !== 25) {
    throw new Error("Branch balancing integration failed");
  }
  tests.push(pass("SYSBAL-002", "Critical branch and damper target"));

  if (
    result.airflowReconciliation.supplyAirflowCfm !== 700 ||
    result.airflowReconciliation.returnAirflowCfm !== 680 ||
    result.airflowReconciliation.recirculatedAirflowCfm !== 610
  ) throw new Error("System airflow reconciliation failed");
  tests.push(pass("SYSBAL-003", "System airflow reconciliation"));

  if (!approx(result.requirements.roomLoadKw, 8) || !approx(result.requirements.designCapacityKw, 8.8) || result.requirements.supplyAirflowCfm !== 700) {
    throw new Error("System requirements integration failed");
  }
  tests.push(pass("SYSBAL-004", "System capacity and airflow requirements"));

  if (!approx(result.requirements.baseFanEspPa, 360) || !approx(result.requirements.requiredFanEspPa, 396)) {
    throw new Error("Fan ESP requirement integration failed");
  }
  tests.push(pass("SYSBAL-005", "Integrated fan ESP requirement"));

  if (!result.selection.capacityPass || !result.selection.airflowPass || !result.selection.espPass || !result.selection.passed) {
    throw new Error("Selected system was incorrectly rejected");
  }
  tests.push(pass("SYSBAL-006", "Integrated system selection validation"));

  if (result.engineeringStatus !== "PASS" || result.verificationRequired !== true) {
    throw new Error("Stage 16 engineering status failed");
  }
  tests.push(pass("SYSBAL-007", "Stage 16 engineering status"));

  const summary = summarizeStage16(result);
  if (summary.terminalsRequiringAdjustment !== 0 || summary.requiredCapacityKw !== 8.8 || summary.selectedFanEspPa !== 440) {
    throw new Error("Stage 16 summary failed");
  }
  tests.push(pass("SYSBAL-008", "Stage 16 summary"));

  const actionResult = integrateAirBalancingAndSystem({
    ...baseInput,
    terminals: [
      { id: "T1", roomId: "Office A", designAirflowCfm: 400, measuredAirflowCfm: 360 },
      { id: "T2", roomId: "Office B", designAirflowCfm: 300, measuredAirflowCfm: 300 },
    ],
  });
  if (actionResult.engineeringStatus !== "ACTION_REQUIRED" || actionResult.balanceReport.summary.adjustmentCount !== 1) {
    throw new Error("Out-of-balance system was not flagged");
  }
  tests.push(pass("SYSBAL-009", "Out-of-balance action status"));

  if (!expectThrows(() => integrateAirBalancingAndSystem({ ...baseInput, tolerancePercent: 0 }))) {
    throw new Error("Invalid tolerance was not rejected");
  }
  if (!expectThrows(() => integrateAirBalancingAndSystem({ ...baseInput, terminals: [] }))) {
    throw new Error("Empty terminal schedule was not rejected");
  }
  tests.push(pass("SYSBAL-010", "Stage 16 input validation"));

  return tests;
};
