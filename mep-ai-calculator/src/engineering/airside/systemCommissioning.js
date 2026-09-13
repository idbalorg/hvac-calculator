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
 * Stage 17 commissioning/handover checks for ducted air systems.
 * Field measurements and manufacturer data are caller supplied. The engine
 * does not assume universal commissioning tolerances or equipment limits.
 */
export const calculateCommissioningChecks = ({
  designAirflowCfm,
  measuredAirflowCfm,
  airflowTolerancePercent = 10,
  designCapacityKw,
  measuredCapacityKw = null,
  capacityTolerancePercent = 10,
  requiredFanEspPa,
  measuredFanEspPa = null,
  espTolerancePercent = 10,
}) => {
  assertPositive(designAirflowCfm, "designAirflowCfm");
  assertNonNegative(measuredAirflowCfm, "measuredAirflowCfm");
  assertPositive(airflowTolerancePercent, "airflowTolerancePercent");
  assertPositive(designCapacityKw, "designCapacityKw");
  assertPositive(capacityTolerancePercent, "capacityTolerancePercent");
  assertPositive(requiredFanEspPa, "requiredFanEspPa");
  assertPositive(espTolerancePercent, "espTolerancePercent");

  const airflowDeviationPercent = ((measuredAirflowCfm - designAirflowCfm) / designAirflowCfm) * 100;
  const airflowPass = Math.abs(airflowDeviationPercent) <= airflowTolerancePercent;

  let capacityDeviationPercent = null;
  let capacityPass = null;
  if (measuredCapacityKw !== null) {
    assertNonNegative(measuredCapacityKw, "measuredCapacityKw");
    capacityDeviationPercent = ((measuredCapacityKw - designCapacityKw) / designCapacityKw) * 100;
    capacityPass = Math.abs(capacityDeviationPercent) <= capacityTolerancePercent;
  }

  let espDeviationPercent = null;
  let espPass = null;
  if (measuredFanEspPa !== null) {
    assertNonNegative(measuredFanEspPa, "measuredFanEspPa");
    espDeviationPercent = ((measuredFanEspPa - requiredFanEspPa) / requiredFanEspPa) * 100;
    espPass = measuredFanEspPa >= requiredFanEspPa * (1 - espTolerancePercent / 100);
  }

  const checks = [airflowPass, capacityPass, espPass].filter((value) => value !== null);
  return {
    applicability: "DUCTED_AIR_SYSTEM",
    airflowDeviationPercent,
    airflowPass,
    capacityDeviationPercent,
    capacityPass,
    espDeviationPercent,
    espPass,
    status: checks.every(Boolean) ? "PASS" : "ACTION_REQUIRED",
    verificationRequired: true,
  };
};

/**
 * Direct-discharge systems do not have a supply-duct network, branch airflow,
 * or fan external-static-pressure design basis to commission. Their handover
 * path is therefore equipment/space performance and installation verification.
 */
export const buildDirectDischargeCommissioning = ({
  systemType,
  distributionType = "DIRECT_DISCHARGE",
  projectId,
  systemId,
  checks = {},
}) => {
  if (typeof projectId !== "string" || !projectId.trim()) throw new Error("projectId is required");
  if (typeof systemId !== "string" || !systemId.trim()) throw new Error("systemId is required");

  const items = [
    { id: "EQUIPMENT-OPERATION", name: "Indoor unit operation and controls verified", status: checks.equipmentOperational ? "PASS" : "PENDING" },
    { id: "ROOM-PERFORMANCE", name: "Room cooling performance verified", status: checks.roomPerformance ? "PASS" : "PENDING" },
    { id: "CONDENSATE", name: "Condensate drainage verified", status: checks.condensateDrainage ? "PASS" : "PENDING" },
    { id: "REFRIGERANT", name: "Refrigerant circuit / installation verified", status: checks.refrigerantInstallation ? "PASS" : "PENDING" },
    { id: "ELECTRICAL", name: "Electrical supply and protection verified", status: checks.electrical ? "PASS" : "PENDING" },
    { id: "CONTROLS", name: "Controls and operating sequence verified", status: checks.controlsVerified ? "PASS" : "PENDING" },
    { id: "DOCUMENTATION", name: "As-built and commissioning documentation complete", status: checks.documentationVerified ? "PASS" : "PENDING" },
  ];

  const complete = items.every((item) => item.status === "PASS");
  const commissioningStatus = complete ? "READY_FOR_HANDOVER" : "FIELD_VERIFICATION_REQUIRED";
  const commissioningChecks = {
    applicability: "DIRECT_DISCHARGE",
    systemType,
    distributionType,
    airflowDeviationPercent: null,
    airflowPass: null,
    capacityDeviationPercent: null,
    capacityPass: null,
    espDeviationPercent: null,
    espPass: null,
    status: commissioningStatus,
    verificationRequired: true,
  };

  const checklist = { items, complete };
  const handover = {
    projectId,
    systemId,
    commissioningStatus,
    checks: commissioningChecks,
    checklist,
    verificationRequired: true,
    handoverReady: complete,
  };

  return { checks: commissioningChecks, checklist, handover };
};

export const buildCommissioningChecklist = ({
  airflowCheck,
  capacityCheck = null,
  espCheck = null,
  controlsVerified = false,
  documentationVerified = false,
}) => {
  if (!airflowCheck || typeof airflowCheck !== "object") throw new Error("airflowCheck is required");
  const items = [
    { id: "TAB-AIRFLOW", name: "Terminal airflow verification", status: airflowCheck.airflowPass ? "PASS" : "ACTION_REQUIRED" },
    { id: "CAPACITY", name: "Cooling capacity verification", status: capacityCheck === null ? "PENDING" : capacityCheck.capacityPass ? "PASS" : "ACTION_REQUIRED" },
    { id: "FAN-ESP", name: "Fan ESP verification", status: espCheck === null ? "PENDING" : espCheck.espPass ? "PASS" : "ACTION_REQUIRED" },
    { id: "CONTROLS", name: "Controls and sequence verification", status: controlsVerified ? "PASS" : "PENDING" },
    { id: "DOCUMENTATION", name: "As-built and commissioning documentation", status: documentationVerified ? "PASS" : "PENDING" },
  ];
  return { items, complete: items.every((item) => item.status === "PASS") };
};

export const buildCommissioningHandover = ({ projectId, systemId, checks, checklist }) => {
  if (typeof projectId !== "string" || !projectId.trim()) throw new Error("projectId is required");
  if (typeof systemId !== "string" || !systemId.trim()) throw new Error("systemId is required");
  if (!checks || !checklist) throw new Error("checks and checklist are required");
  return {
    projectId,
    systemId,
    commissioningStatus: checklist.complete && checks.status === "PASS" ? "READY_FOR_HANDOVER" : "ACTION_REQUIRED",
    checks,
    checklist,
    verificationRequired: true,
  };
};
