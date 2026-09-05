import { calculateAirBalanceReport, calculateBranchBalancing } from "./airBalancing.js";
import { calculateSystemRequirements, reconcileSystemAirflows, validateSystemSelection, buildSystemSummary } from "./systemIntegration.js";

const assertFinite = (value, name) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
};

const assertNonNegative = (value, name) => {
  assertFinite(value, name);
  if (value < 0) throw new Error(`${name} cannot be negative`);
};

const assertPositive = (value, name) => {
  assertFinite(value, name);
  if (value <= 0) throw new Error(`${name} must be greater than zero`);
};

/**
 * Stage 16 orchestration layer.
 * Combines the Stage 15 distribution result with field balancing inputs and
 * system-level airflow/capacity/ESP reconciliation. Manufacturer data and
 * field measurements remain caller-supplied.
 */
export const integrateAirBalancingAndSystem = ({
  terminals,
  branchPressureLossesPa,
  tolerancePercent,
  roomLoadsKw,
  roomAirflowsCfm,
  outdoorAirflowCfm = 0,
  transferAirflowCfm = 0,
  criticalPathPressureLossPa,
  terminalPressureDropPa = 0,
  coilPressureDropPa = 0,
  filterPressureDropPa = 0,
  damperPressureDropPa = 0,
  otherPressureDropsPa = [],
  espSafetyFactor = 0,
  capacityMargin = 0,
  selectedCapacityKw,
  selectedAirflowCfm,
  selectedFanEspPa,
  maxOversizeFraction = null,
}) => {
  if (!Array.isArray(terminals) || terminals.length === 0) throw new Error("terminals must contain at least one terminal");
  if (!Array.isArray(branchPressureLossesPa) || branchPressureLossesPa.length === 0) throw new Error("branchPressureLossesPa must contain at least one branch");
  assertPositive(tolerancePercent, "tolerancePercent");

  const balanceReport = calculateAirBalanceReport({ terminals, tolerancePercent });
  const branchBalancing = calculateBranchBalancing({ branchPressureLossesPa });
  const airflowReconciliation = reconcileSystemAirflows({
    terminalAirflowsCfm: terminals.map((terminal) => terminal.designAirflowCfm),
    outdoorAirflowCfm,
    transferAirflowCfm,
  });

  const requirements = calculateSystemRequirements({
    roomLoadsKw,
    roomAirflowsCfm,
    criticalPathPressureLossPa,
    terminalPressureDropPa,
    coilPressureDropPa,
    filterPressureDropPa,
    damperPressureDropPa,
    otherPressureDropsPa,
    safetyFactor: espSafetyFactor,
    capacityMargin,
  });

  const selection = validateSystemSelection({
    requiredCapacityKw: requirements.designCapacityKw,
    selectedCapacityKw,
    requiredAirflowCfm: requirements.supplyAirflowCfm,
    selectedAirflowCfm,
    requiredFanEspPa: requirements.requiredFanEspPa,
    selectedFanEspPa,
    maxOversizeFraction,
  });

  const systemSummary = buildSystemSummary({
    systemId: "SYSTEM-01",
    systemType: "INTEGRATED_AIR_DISTRIBUTION",
    requirements,
    selection,
  });

  const engineeringStatus = balanceReport.summary.balanced && systemSummary.status === "PASS"
    ? "PASS"
    : "ACTION_REQUIRED";

  return {
    balanceReport,
    branchBalancing,
    airflowReconciliation,
    requirements,
    selection,
    systemSummary,
    engineeringStatus,
    verificationRequired: true,
  };
};

export const summarizeStage16 = (result) => {
  if (!result || !result.balanceReport || !result.selection) throw new Error("A Stage 16 result is required");
  return {
    engineeringStatus: result.engineeringStatus,
    terminals: result.balanceReport.summary.total,
    balancedTerminals: result.balanceReport.summary.balancedCount,
    terminalsRequiringAdjustment: result.balanceReport.summary.adjustmentCount,
    criticalBranchId: result.branchBalancing.criticalBranchId,
    criticalPressureLossPa: result.branchBalancing.criticalPressureLossPa,
    supplyAirflowCfm: result.airflowReconciliation.supplyAirflowCfm,
    returnAirflowCfm: result.airflowReconciliation.returnAirflowCfm,
    requiredCapacityKw: result.requirements.designCapacityKw,
    requiredFanEspPa: result.requirements.requiredFanEspPa,
    selectedCapacityKw: result.selection.selectedCapacityKw,
    selectedAirflowCfm: result.selection.selectedAirflowCfm,
    selectedFanEspPa: result.selection.selectedFanEspPa,
    verificationRequired: result.verificationRequired,
  };
};
