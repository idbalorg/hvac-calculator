import { calculateDistributionAirflow, validateEquipmentAirflow, integrateAirDistribution, selectDistributionTerminal } from "../engineering/airside/fullAirDistribution.js";

const approx = (actual, expected, tolerance = 1e-6) => {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`Expected ${actual} to be approximately ${expected}`);
};
const pass = (id, name) => ({ id, name, passed: true });
const run = (id, name, fn) => {
  try { fn(); return pass(id, name); }
  catch (error) { return { id, name, passed: false, error: error instanceof Error ? error.message : String(error) }; }
};

const branches = [
  { id: "B1", terminalIds: ["T1"], airflowCfm: 250, targetVelocityMps: 5, shape: "rectangular", widthM: 0.2, segments: [{ volumeFlowM3s: 250 / 2118.88, areaM2: 0.01, lengthM: 10, frictionRatePaPerM: 0.5, lossCoefficientK: 1 }] },
  { id: "B2", terminalIds: ["T2"], airflowCfm: 250, targetVelocityMps: 5, shape: "rectangular", widthM: 0.2, segments: [{ volumeFlowM3s: 250 / 2118.88, areaM2: 0.01, lengthM: 6, frictionRatePaPerM: 0.5, lossCoefficientK: 1 }] },
];

export const runFullAirDistributionTests = () => [
  run("AIRINT-001", "Distribution airflow conversion", () => {
    const result = calculateDistributionAirflow({ requiredAirflowM3s: 0.236, terminalCount: 2 });
    approx(result.requiredAirflowCfm, 0.236 * 2118.88, 1e-6);
    approx(result.airflowPerTerminalCfm, (0.236 * 2118.88) / 2, 1e-6);
  }),
  run("AIRINT-002", "Equipment airflow matches requirement", () => {
    const result = validateEquipmentAirflow({ selectedEquipmentAirflowCfm: 500, requiredAirflowCfm: 500, toleranceFraction: 0.05 });
    if (!result.acceptable) throw new Error("Expected airflow to be acceptable");
  }),
  run("AIRINT-003", "Equipment airflow mismatch is flagged", () => {
    const result = validateEquipmentAirflow({ selectedEquipmentAirflowCfm: 600, requiredAirflowCfm: 500, toleranceFraction: 0.05 });
    if (result.acceptable) throw new Error("Expected airflow mismatch to require review");
  }),
  run("AIRINT-004", "Branch airflow is conserved", () => {
    const result = integrateAirDistribution({ selectedEquipmentAirflowCfm: 500, requiredAirflowM3s: 500 / 2118.88, branches, airflowToleranceFraction: 0.01 });
    approx(result.network.totalSupplyAirflowM3s, 500 / 2118.88, 1e-6);
  }),
  run("AIRINT-005", "Critical duct path includes branch loss", () => {
    const result = integrateAirDistribution({ selectedEquipmentAirflowCfm: 500, requiredAirflowM3s: 500 / 2118.88, branches, airflowToleranceFraction: 0.01 });
    if (!(result.criticalDuctLossPa > 0)) throw new Error("Expected positive critical duct loss");
    approx(result.criticalDuctLossPa, result.network.mainPressureLossPa + Math.max(...result.network.branchPressureLossesPa.map((item) => item.pressureLossPa)));
  }),
  run("AIRINT-006", "Required fan ESP includes component losses", () => {
    const result = integrateAirDistribution({ selectedEquipmentAirflowCfm: 500, requiredAirflowM3s: 500 / 2118.88, branches, terminalPressureDropPa: 50, coilPressureDropPa: 80, filterPressureDropPa: 30, damperPressureDropPa: 20, espSafetyFactor: 0.1, airflowToleranceFraction: 0.01 });
    if (!(result.esp.requiredFanESP_Pa > result.criticalDuctLossPa)) throw new Error("Expected total ESP to exceed duct-only loss");
  }),
  run("AIRINT-007", "Available ESP shortfall is flagged", () => {
    const result = integrateAirDistribution({ selectedEquipmentAirflowCfm: 500, availableFanEspPa: 10, requiredAirflowM3s: 500 / 2118.88, branches, terminalPressureDropPa: 50, coilPressureDropPa: 80, airflowToleranceFraction: 0.01 });
    if (result.espCheck.acceptable) throw new Error("Expected insufficient ESP to require review");
    if (result.engineeringStatus !== "AIR_DISTRIBUTION_REVIEW_REQUIRED") throw new Error("Expected review status");
  }),
  run("AIRINT-008", "Manufacturer-neutral terminal selection integrates", () => {
    const result = selectDistributionTerminal({ requiredAirflowCfm: 500, numberOfTerminals: 2, terminals: [{ id: "T1", type: "ceiling_diffuser", minAirflowCfm: 100, maxAirflowCfm: 300, pressureDropPa: 25 }] });
    if (!result.suitable || result.selected.id !== "T1") throw new Error("Expected suitable terminal selection");
    approx(result.airflowPerTerminalCfm, 250);
  }),
];
