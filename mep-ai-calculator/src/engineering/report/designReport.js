import {
  buildDuctSchedule,
  buildEquipmentSchedule,
  buildRoomSchedule,
  summarizeSchedules,
} from "./designSchedules.js";

const assertFinite = (value, name) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
};

const assertNonNegative = (value, name) => {
  assertFinite(value, name);
  if (value < 0) throw new Error(`${name} cannot be negative`);
};

const check = (condition, passMessage, failMessage) => ({
  status: condition ? "PASS" : "FAIL",
  message: condition ? passMessage : failMessage,
});

/**
 * Validates the design package using explicit project criteria.
 * Criteria are intentionally caller-supplied rather than hidden engineering constants.
 */
export const validateDesignPackage = ({
  summary,
  equipmentSchedule,
  systemSummary = null,
  criteria,
}) => {
  if (!summary || !equipmentSchedule) throw new Error("summary and equipmentSchedule are required");
  if (!criteria) throw new Error("criteria is required");

  const {
    minimumCapacityMarginPercent = 0,
    maximumCapacityOversizePercent = null,
    minimumAirflowRatio = 1,
    minimumEspRatio = 1,
  } = criteria;

  assertNonNegative(minimumCapacityMarginPercent, "minimumCapacityMarginPercent");
  if (maximumCapacityOversizePercent !== null) assertNonNegative(maximumCapacityOversizePercent, "maximumCapacityOversizePercent");
  assertNonNegative(minimumAirflowRatio, "minimumAirflowRatio");
  assertNonNegative(minimumEspRatio, "minimumEspRatio");

  const equipmentChecks = equipmentSchedule.map((unit) => {
    const capacityRatio = unit.requiredCapacityKw === 0 ? Infinity : unit.capacityKw / unit.requiredCapacityKw;
    const airflowRatio = unit.designAirflowCfm === 0 ? Infinity : unit.selectedAirflowCfm / unit.designAirflowCfm;
    const espRatio = unit.requiredEspPa === 0 ? Infinity : unit.selectedEspPa / unit.requiredEspPa;
    const capacityPass = unit.capacityMarginPercent >= minimumCapacityMarginPercent && (
      maximumCapacityOversizePercent === null || unit.capacityMarginPercent <= maximumCapacityOversizePercent
    );

    return {
      equipmentId: unit.equipmentId,
      capacity: check(capacityPass, "Capacity selection is within specified margin", "Capacity selection is outside specified margin"),
      airflow: check(airflowRatio >= minimumAirflowRatio, "Selected airflow is adequate", "Selected airflow is below required ratio"),
      esp: check(espRatio >= minimumEspRatio, "Selected fan ESP is adequate", "Selected fan ESP is below required ratio"),
      capacityRatio,
      airflowRatio,
      espRatio,
    };
  });

  const systemChecks = systemSummary ? {
    systemSelection: check(systemSummary.status === "PASS", "System selection passes upstream integration checks", "System selection failed upstream integration checks"),
  } : {};

  const allChecks = [
    ...equipmentChecks.flatMap((item) => [item.capacity, item.airflow, item.esp]),
    ...Object.values(systemChecks),
  ];

  return {
    passed: allChecks.every((item) => item.status === "PASS"),
    equipmentChecks,
    systemChecks,
    criteria: {
      minimumCapacityMarginPercent,
      maximumCapacityOversizePercent,
      minimumAirflowRatio,
      minimumEspRatio,
    },
  };
};

/**
 * Creates the complete structured design report consumed by UI/PDF/export layers.
 * generatedAt is optional and injected by the caller when deterministic output is needed.
 */
export const buildDesignReport = ({
  project,
  rooms,
  equipment,
  ducts,
  systemSummary = null,
  criteria,
  generatedAt = null,
}) => {
  if (!project || typeof project !== "object") throw new Error("project is required");

  const roomSchedule = buildRoomSchedule({ rooms });
  const equipmentSchedule = buildEquipmentSchedule({ equipment });
  const ductSchedule = buildDuctSchedule({ ducts });
  const summary = summarizeSchedules({
    rooms: roomSchedule,
    equipment: equipmentSchedule,
    ducts: ductSchedule,
  });
  const validation = validateDesignPackage({
    summary,
    equipmentSchedule,
    systemSummary,
    criteria,
  });

  return {
    reportVersion: "1.0",
    generatedAt,
    project,
    schedules: {
      rooms: roomSchedule,
      equipment: equipmentSchedule,
      ducts: ductSchedule,
    },
    summary,
    systemSummary,
    validation,
  };
};
