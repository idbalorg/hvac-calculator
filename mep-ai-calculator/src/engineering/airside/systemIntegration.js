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
 * Reconciles room terminal airflows with the system supply airflow.
 * Return/transfer airflow are tracked explicitly so the model does not
 * silently assume that supply airflow equals outdoor airflow.
 */
export const reconcileSystemAirflows = ({
  terminalAirflowsCfm,
  outdoorAirflowCfm = 0,
  transferAirflowCfm = 0,
}) => {
  if (!Array.isArray(terminalAirflowsCfm) || terminalAirflowsCfm.length === 0) {
    throw new Error("terminalAirflowsCfm must contain at least one airflow");
  }
  terminalAirflowsCfm.forEach((value) => assertNonNegative(value, "Terminal airflow"));
  assertNonNegative(outdoorAirflowCfm, "outdoorAirflowCfm");
  assertNonNegative(transferAirflowCfm, "transferAirflowCfm");

  const supplyAirflowCfm = terminalAirflowsCfm.reduce((sum, value) => sum + value, 0);
  const returnAirflowCfm = Math.max(0, supplyAirflowCfm - transferAirflowCfm);

  return {
    supplyAirflowCfm,
    outdoorAirflowCfm,
    transferAirflowCfm,
    returnAirflowCfm,
    recirculatedAirflowCfm: Math.max(0, returnAirflowCfm - outdoorAirflowCfm),
  };
};

/**
 * Creates the system-level design requirements from upstream calculations.
 * All capacity and pressure-drop values are caller-supplied, keeping
 * manufacturer-dependent data outside the engineering core.
 */
export const calculateSystemRequirements = ({
  roomLoadsKw,
  roomAirflowsCfm,
  criticalPathPressureLossPa,
  terminalPressureDropPa = 0,
  coilPressureDropPa = 0,
  filterPressureDropPa = 0,
  damperPressureDropPa = 0,
  otherPressureDropsPa = [],
  safetyFactor = 0,
  capacityMargin = 0,
}) => {
  if (!Array.isArray(roomLoadsKw) || roomLoadsKw.length === 0) {
    throw new Error("roomLoadsKw must contain at least one room load");
  }
  if (!Array.isArray(roomAirflowsCfm) || roomAirflowsCfm.length === 0) {
    throw new Error("roomAirflowsCfm must contain at least one room airflow");
  }
  roomLoadsKw.forEach((value) => assertNonNegative(value, "Room load"));
  roomAirflowsCfm.forEach((value) => assertNonNegative(value, "Room airflow"));
  assertNonNegative(criticalPathPressureLossPa, "criticalPathPressureLossPa");
  [terminalPressureDropPa, coilPressureDropPa, filterPressureDropPa, damperPressureDropPa]
    .forEach((value, index) => assertNonNegative(value, ["terminalPressureDropPa", "coilPressureDropPa", "filterPressureDropPa", "damperPressureDropPa"][index]));
  if (!Array.isArray(otherPressureDropsPa)) throw new Error("otherPressureDropsPa must be an array");
  otherPressureDropsPa.forEach((value) => assertNonNegative(value, "Other pressure drop"));
  assertNonNegative(safetyFactor, "safetyFactor");
  assertNonNegative(capacityMargin, "capacityMargin");

  const roomLoadKw = roomLoadsKw.reduce((sum, value) => sum + value, 0);
  const designCapacityKw = roomLoadKw * (1 + capacityMargin);
  const supplyAirflowCfm = roomAirflowsCfm.reduce((sum, value) => sum + value, 0);
  const otherPressureDropPa = otherPressureDropsPa.reduce((sum, value) => sum + value, 0);
  const baseFanEspPa = criticalPathPressureLossPa + terminalPressureDropPa + coilPressureDropPa + filterPressureDropPa + damperPressureDropPa + otherPressureDropPa;
  const requiredFanEspPa = baseFanEspPa * (1 + safetyFactor);

  return {
    roomLoadKw,
    designCapacityKw,
    capacityMargin,
    supplyAirflowCfm,
    criticalPathPressureLossPa,
    baseFanEspPa,
    requiredFanEspPa,
    safetyFactor,
  };
};

/**
 * Checks selected equipment against system requirements.
 * Capacity must not be undersized. A maximum oversize fraction can be
 * supplied by the designer to prevent an unnecessarily large selection.
 */
export const validateSystemSelection = ({
  requiredCapacityKw,
  selectedCapacityKw,
  requiredAirflowCfm,
  selectedAirflowCfm,
  requiredFanEspPa,
  selectedFanEspPa,
  maxOversizeFraction = null,
}) => {
  assertPositive(requiredCapacityKw, "requiredCapacityKw");
  assertPositive(selectedCapacityKw, "selectedCapacityKw");
  assertPositive(requiredAirflowCfm, "requiredAirflowCfm");
  assertPositive(selectedAirflowCfm, "selectedAirflowCfm");
  assertPositive(requiredFanEspPa, "requiredFanEspPa");
  assertPositive(selectedFanEspPa, "selectedFanEspPa");
  if (maxOversizeFraction !== null) assertNonNegative(maxOversizeFraction, "maxOversizeFraction");

  const capacityRatio = selectedCapacityKw / requiredCapacityKw;
  const airflowRatio = selectedAirflowCfm / requiredAirflowCfm;
  const capacityOversizeFraction = capacityRatio - 1;

  const capacityPass = capacityRatio >= 1 && (
    maxOversizeFraction === null || capacityOversizeFraction <= maxOversizeFraction
  );
  const airflowPass = airflowRatio >= 1;
  const espPass = selectedFanEspPa >= requiredFanEspPa;

  return {
    capacityRatio,
    airflowRatio,
    capacityOversizeFraction,
    capacityPass,
    airflowPass,
    espPass,
    passed: capacityPass && airflowPass && espPass,
  };
};

export const buildSystemSummary = ({
  systemId,
  systemType,
  requirements,
  selection,
}) => {
  if (typeof systemId !== "string" || systemId.trim() === "") throw new Error("systemId is required");
  if (typeof systemType !== "string" || systemType.trim() === "") throw new Error("systemType is required");
  if (!requirements || !selection) throw new Error("requirements and selection are required");

  return {
    systemId,
    systemType,
    design: requirements,
    selected: selection,
    status: selection.passed ? "PASS" : "FAIL",
  };
};
