import {
  calculateAirBalanceReport,
  calculateAirflowDeviation,
  calculateBranchBalancing,
  calculateTerminalBalance,
  classifyAirflowBalance,
} from "../engineering/airside/airBalancing.js";

const approx = (actual, expected, tolerance = 1e-9) => Math.abs(actual - expected) <= tolerance;

const pass = (id, name, details = {}) => ({ id, name, passed: true, details });

const expectThrows = (fn) => {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
};

export const runAirBalancingTests = () => {
  const tests = [];

  const balancing = calculateBranchBalancing({
    branchPressureLossesPa: [
      { id: "B1", pressureLossPa: 120 },
      { id: "B2", pressureLossPa: 95 },
      { id: "B3", pressureLossPa: 120 },
    ],
  });
  if (
    balancing.criticalBranchId !== "B1" ||
    balancing.criticalPressureLossPa !== 120 ||
    balancing.branches.find((b) => b.id === "B2")?.balancingDamperPressureDropPa !== 25 ||
    balancing.branches.find((b) => b.id === "B1")?.balancingDamperPressureDropPa !== 0
  ) throw new Error("Automatic critical branch and damper pressure drop calculation failed");
  tests.push(pass("UNIT-BAL-001", "Branch balancing and critical path"));

  const explicitCritical = calculateBranchBalancing({
    branchPressureLossesPa: [
      { id: "B1", pressureLossPa: 100 },
      { id: "B2", pressureLossPa: 80 },
    ],
    criticalBranchId: "B2",
  });
  if (
    explicitCritical.criticalBranchId !== "B2" ||
    explicitCritical.branches.find((b) => b.id === "B1")?.balancingDamperPressureDropPa !== 0
  ) throw new Error("Explicit critical branch handling failed");
  tests.push(pass("UNIT-BAL-002", "Explicit critical branch"));

  const deviation = calculateAirflowDeviation({
    designAirflowCfm: 500,
    measuredAirflowCfm: 450,
  });
  if (
    deviation.deviationCfm !== -50 ||
    !approx(deviation.deviationPercent, -10) ||
    !approx(deviation.absoluteDeviationPercent, 10)
  ) throw new Error("Airflow deviation calculation failed");
  tests.push(pass("UNIT-BAL-003", "Terminal airflow deviation"));

  if (classifyAirflowBalance({ deviationPercent: 8, tolerancePercent: 10 }) !== "BALANCED") {
    throw new Error("Within-tolerance airflow was not classified as balanced");
  }
  if (classifyAirflowBalance({ deviationPercent: -10, tolerancePercent: 10 }) !== "BALANCED") {
    throw new Error("Tolerance boundary was not classified as balanced");
  }
  if (classifyAirflowBalance({ deviationPercent: 10.1, tolerancePercent: 10 }) !== "ADJUST") {
    throw new Error("Outside-tolerance airflow was not flagged for adjustment");
  }
  tests.push(pass("UNIT-BAL-004", "Airflow balance classification"));

  const terminal = calculateTerminalBalance({
    designAirflowCfm: 400,
    measuredAirflowCfm: 440,
    tolerancePercent: 10,
  });
  if (terminal.status !== "BALANCED" || terminal.deviationCfm !== 40 || !approx(terminal.deviationPercent, 10)) {
    throw new Error("Terminal balance result failed");
  }
  tests.push(pass("UNIT-BAL-005", "Terminal balance result"));

  const report = calculateAirBalanceReport({
    tolerancePercent: 10,
    terminals: [
      { id: "T1", roomId: "Office A", designAirflowCfm: 400, measuredAirflowCfm: 390 },
      { id: "T2", roomId: "Office B", designAirflowCfm: 300, measuredAirflowCfm: 270 },
      { id: "T3", roomId: "Meeting", designAirflowCfm: 250, measuredAirflowCfm: 280 },
    ],
  });
  if (
    report.summary.total !== 3 ||
    report.summary.balancedCount !== 2 ||
    report.summary.adjustmentCount !== 1 ||
    report.summary.balanced !== false ||
    report.rows[1].status !== "BALANCED" ||
    report.rows[2].status !== "ADJUST"
  ) throw new Error("Air balance report summary or rows failed");
  tests.push(pass("UNIT-BAL-006", "Air balance report"));

  if (!expectThrows(() => calculateAirflowDeviation({ designAirflowCfm: 0, measuredAirflowCfm: 100 }))) {
    throw new Error("Invalid design airflow was not rejected");
  }
  if (!expectThrows(() => calculateBranchBalancing({
    branchPressureLossesPa: [{ id: "B1", pressureLossPa: -1 }],
  }))) {
    throw new Error("Negative branch pressure loss was not rejected");
  }
  tests.push(pass("UNIT-BAL-007", "Air balancing input validation"));

  return tests;
};
