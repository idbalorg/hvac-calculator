/**
 * Manufacturer-neutral equipment catalogue validation.
 *
 * Manufacturer/model performance data must be supplied by the user or an
 * approved catalogue. This module only validates structure and engineering
 * quantities. It does not invent manufacturer specifications.
 */

const assertFinite = (value, name) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
};

const assertPositive = (value, name) => {
  assertFinite(value, name);
  if (value <= 0) throw new Error(`${name} must be greater than zero`);
};

const assertNonNegative = (value, name) => {
  assertFinite(value, name);
  if (value < 0) throw new Error(`${name} cannot be negative`);
};

export const validateEquipmentRecord = (equipment) => {
  if (!equipment || typeof equipment !== "object") throw new Error("Equipment record is required");
  if (typeof equipment.id !== "string" || equipment.id.trim() === "") throw new Error("Equipment id is required");
  if (typeof equipment.type !== "string" || equipment.type.trim() === "") throw new Error("Equipment type is required");
  assertPositive(equipment.coolingCapacityKw, "coolingCapacityKw");

  if (equipment.airflowCfm !== undefined) assertPositive(equipment.airflowCfm, "airflowCfm");
  if (equipment.minAirflowCfm !== undefined) assertPositive(equipment.minAirflowCfm, "minAirflowCfm");
  if (equipment.maxAirflowCfm !== undefined) assertPositive(equipment.maxAirflowCfm, "maxAirflowCfm");
  if (equipment.minAirflowCfm !== undefined && equipment.maxAirflowCfm !== undefined && equipment.maxAirflowCfm < equipment.minAirflowCfm) {
    throw new Error("maxAirflowCfm cannot be less than minAirflowCfm");
  }
  if (equipment.availableEspPa !== undefined) assertNonNegative(equipment.availableEspPa, "availableEspPa");
  if (equipment.externalStaticPressurePa !== undefined) assertNonNegative(equipment.externalStaticPressurePa, "externalStaticPressurePa");

  return { ...equipment };
};

export const normalizeEquipmentCatalogue = (equipment = []) => {
  if (!Array.isArray(equipment)) throw new Error("equipment must be an array");
  return equipment.map(validateEquipmentRecord);
};

export const getEquipmentAirflowRange = (equipment) => {
  validateEquipmentRecord(equipment);
  if (equipment.airflowCfm !== undefined) return { minCfm: equipment.airflowCfm, maxCfm: equipment.airflowCfm };
  if (equipment.minAirflowCfm !== undefined || equipment.maxAirflowCfm !== undefined) {
    return {
      minCfm: equipment.minAirflowCfm ?? equipment.maxAirflowCfm,
      maxCfm: equipment.maxAirflowCfm ?? equipment.minAirflowCfm,
    };
  }
  return null;
};
