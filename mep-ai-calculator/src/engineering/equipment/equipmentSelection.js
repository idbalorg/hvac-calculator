import { getEquipmentAirflowRange, normalizeEquipmentCatalogue, validateEquipmentRecord } from "./equipmentCatalogue.js";

const assertPositive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be greater than zero`);
};

const assertNonNegative = (value, name) => {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} cannot be negative`);
};

const airflowCheck = (equipment, requiredAirflowCfm, airflowToleranceFraction) => {
  if (requiredAirflowCfm === null || requiredAirflowCfm === undefined) {
    return { status: "NOT_EVALUATED", pass: true, marginCfm: null, marginFraction: null };
  }
  const range = getEquipmentAirflowRange(equipment);
  if (!range) return { status: "MISSING_DATA", pass: false, marginCfm: null, marginFraction: null };
  const lowerBound = requiredAirflowCfm * (1 - airflowToleranceFraction);
  const upperBound = requiredAirflowCfm * (1 + airflowToleranceFraction);
  const pass = range.minCfm <= upperBound && range.maxCfm >= lowerBound;
  const marginCfm = range.maxCfm - requiredAirflowCfm;
  return {
    status: pass ? "PASS" : "FAIL",
    pass,
    minCfm: range.minCfm,
    maxCfm: range.maxCfm,
    marginCfm,
    marginFraction: marginCfm / requiredAirflowCfm,
  };
};

const espCheck = (equipment, requiredEspPa) => {
  if (requiredEspPa === null || requiredEspPa === undefined) {
    return { status: "NOT_EVALUATED", pass: true, marginPa: null };
  }
  const available = equipment.availableEspPa ?? equipment.externalStaticPressurePa;
  if (available === undefined) return { status: "MISSING_DATA", pass: false, marginPa: null };
  const marginPa = available - requiredEspPa;
  return { status: marginPa >= 0 ? "PASS" : "FAIL", pass: marginPa >= 0, availableEspPa: available, marginPa };
};

export const evaluateEquipmentCandidate = ({
  equipment,
  requiredCapacityKw,
  requiredAirflowCfm = null,
  requiredEspPa = null,
  maxOversizeFraction = null,
  airflowToleranceFraction = 0,
}) => {
  validateEquipmentRecord(equipment);
  assertPositive(requiredCapacityKw, "requiredCapacityKw");
  if (requiredAirflowCfm !== null) assertPositive(requiredAirflowCfm, "requiredAirflowCfm");
  if (requiredEspPa !== null) assertNonNegative(requiredEspPa, "requiredEspPa");
  assertNonNegative(airflowToleranceFraction, "airflowToleranceFraction");
  if (maxOversizeFraction !== null) assertNonNegative(maxOversizeFraction, "maxOversizeFraction");

  const capacityRatio = equipment.coolingCapacityKw / requiredCapacityKw;
  const oversizeFraction = capacityRatio - 1;
  const capacityPass = capacityRatio >= 1 && (maxOversizeFraction === null || oversizeFraction <= maxOversizeFraction);
  const airflow = airflowCheck(equipment, requiredAirflowCfm, airflowToleranceFraction);
  const esp = espCheck(equipment, requiredEspPa);
  const reasons = [];
  if (capacityRatio < 1) reasons.push("UNDERSIZED");
  if (capacityRatio >= 1 && maxOversizeFraction !== null && oversizeFraction > maxOversizeFraction) reasons.push("EXCESSIVE_OVERSIZE");
  if (airflow.status === "MISSING_DATA") reasons.push("MISSING_AIRFLOW_DATA");
  if (airflow.status === "FAIL") reasons.push("INSUFFICIENT_AIRFLOW");
  if (esp.status === "MISSING_DATA") reasons.push("MISSING_ESP_DATA");
  if (esp.status === "FAIL") reasons.push("INSUFFICIENT_ESP");

  return {
    equipment,
    capacityRatio,
    oversizeFraction,
    excessCapacityKw: equipment.coolingCapacityKw - requiredCapacityKw,
    capacityPass,
    airflow,
    esp,
    acceptable: capacityPass && airflow.pass && esp.pass,
    reasons,
  };
};

export const selectEquipment = ({
  requiredCapacityKw,
  equipment = [],
  requiredAirflowCfm = null,
  requiredEspPa = null,
  maxOversizeFraction = null,
  airflowToleranceFraction = 0,
  type = null,
}) => {
  assertPositive(requiredCapacityKw, "requiredCapacityKw");
  const catalogue = normalizeEquipmentCatalogue(equipment);
  const filtered = type === null ? catalogue : catalogue.filter((item) => item.type === type);
  const evaluations = filtered.map((item) => evaluateEquipmentCandidate({
    equipment: item,
    requiredCapacityKw,
    requiredAirflowCfm,
    requiredEspPa,
    maxOversizeFraction,
    airflowToleranceFraction,
  }));
  const candidates = evaluations.filter((item) => item.acceptable).sort((a, b) => (
    a.excessCapacityKw - b.excessCapacityKw ||
    (a.airflow.marginCfm ?? 0) - (b.airflow.marginCfm ?? 0) ||
    (b.esp.marginPa ?? 0) - (a.esp.marginPa ?? 0) ||
    a.equipment.id.localeCompare(b.equipment.id)
  ));
  return {
    requiredCapacityKw,
    requiredAirflowCfm,
    requiredEspPa,
    candidates,
    selected: candidates[0] ?? null,
    evaluated: evaluations,
    warnings: candidates.length === 0 ? ["NO_VALID_EQUIPMENT_SELECTION"] : [],
  };
};

export const validateEquipmentPair = ({ indoorUnit, outdoorUnit }) => {
  validateEquipmentRecord(indoorUnit);
  validateEquipmentRecord(outdoorUnit);
  const explicitMatch = Array.isArray(indoorUnit.compatibleOutdoorUnitIds)
    ? indoorUnit.compatibleOutdoorUnitIds.includes(outdoorUnit.id)
    : null;
  const groupMatch = indoorUnit.matchGroupId !== undefined && outdoorUnit.matchGroupId !== undefined
    ? indoorUnit.matchGroupId === outdoorUnit.matchGroupId
    : null;
  const compatible = explicitMatch === true || (explicitMatch === null && groupMatch === true);
  const reasons = [];
  if (!compatible) reasons.push("INCOMPATIBLE_INDOOR_OUTDOOR_PAIR");
  if (indoorUnit.coolingCapacityKw !== outdoorUnit.coolingCapacityKw) reasons.push("CAPACITY_MISMATCH");
  return {
    compatible: compatible && indoorUnit.coolingCapacityKw === outdoorUnit.coolingCapacityKw,
    explicitMatch,
    groupMatch,
    reasons,
  };
};

export const selectEquipmentPair = ({
  requiredCapacityKw,
  indoorUnits = [],
  outdoorUnits = [],
  requiredAirflowCfm = null,
  requiredEspPa = null,
  maxOversizeFraction = null,
  airflowToleranceFraction = 0,
}) => {
  const indoorResult = selectEquipment({
    requiredCapacityKw,
    equipment: indoorUnits,
    requiredAirflowCfm,
    requiredEspPa,
    maxOversizeFraction,
    airflowToleranceFraction,
  });
  const outdoorCatalogue = normalizeEquipmentCatalogue(outdoorUnits);
  const pairs = [];
  for (const indoor of indoorResult.candidates) {
    for (const outdoor of outdoorCatalogue) {
      const compatibility = validateEquipmentPair({ indoorUnit: indoor.equipment, outdoorUnit: outdoor });
      if (compatibility.compatible) {
        pairs.push({
          indoorUnit: indoor.equipment,
          outdoorUnit: outdoor,
          indoorEvaluation: indoor,
          compatibility,
        });
      }
    }
  }
  pairs.sort((a, b) => a.indoorEvaluation.excessCapacityKw - b.indoorEvaluation.excessCapacityKw || a.indoorUnit.id.localeCompare(b.indoorUnit.id));
  return {
    requiredCapacityKw,
    pairs,
    selected: pairs[0] ?? null,
    warnings: pairs.length === 0 ? ["NO_VALID_INDOOR_OUTDOOR_PAIR"] : [],
  };
};
