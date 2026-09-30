const status = (condition, passMessage, reviewMessage) => ({
  status: condition ? "PASS" : "REVIEW_REQUIRED",
  message: condition ? passMessage : reviewMessage,
});

const finitePositive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const finiteNonNegative = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

const checkLoad = (room) => status(
  finitePositive(room.totalLoadKw),
  "Cooling load is calculated",
  "Cooling load is missing or zero",
);

const checkAirflow = (room) => status(
  finitePositive(room.supplyAirflowCfm),
  "Supply airflow is calculated",
  "Supply airflow is missing or zero",
);

const checkVentilation = (room, criteria) => {
  if (room.dedicatedVentilationRequired !== true && criteria.ventilationRequired !== true) {
    return { status: "NOT_REQUIRED", message: "Dedicated ventilation requirement not flagged" };
  }
  return status(
    finitePositive(room.outdoorAirflowCfm),
    "Outdoor airflow input is present",
    "Required ventilation is flagged but outdoor airflow is missing",
  );
};

const checkEquipmentCapacity = (equipment) => {
  if (!finitePositive(equipment.requiredCapacityKw) || !finitePositive(equipment.capacityKw)) {
    return { status: "REVIEW_REQUIRED", message: "Required and selected equipment capacity data are incomplete" };
  }
  return status(
    equipment.capacityKw >= equipment.requiredCapacityKw,
    "Selected equipment capacity meets calculated load",
    "Selected equipment capacity is below calculated requirement",
  );
};

const checkEquipmentAirflow = (equipment) => {
  if (!finitePositive(equipment.designAirflowCfm) || !finitePositive(equipment.selectedAirflowCfm)) {
    return { status: "REVIEW_REQUIRED", message: "Required and selected equipment airflow data are incomplete" };
  }
  return status(
    equipment.selectedAirflowCfm >= equipment.designAirflowCfm,
    "Selected equipment airflow meets calculated requirement",
    "Selected equipment airflow is below calculated requirement",
  );
};

const checkEsp = (equipment, isDucted) => {
  if (!isDucted || equipment.requiredEspPa === 0) {
    return { status: "NOT_REQUIRED", message: "Fan ESP check is not applicable to this arrangement" };
  }
  if (!finiteNonNegative(equipment.requiredEspPa) || !finiteNonNegative(equipment.selectedEspPa)) {
    return { status: "REVIEW_REQUIRED", message: "Required and selected fan ESP data are incomplete" };
  }
  return status(
    equipment.selectedEspPa >= equipment.requiredEspPa,
    "Selected fan ESP meets calculated requirement",
    "Selected fan ESP is below calculated requirement",
  );
};

const checkDuctCompleteness = (ducts, isDucted) => {
  if (!isDucted) return { status: "NOT_REQUIRED", message: "Duct design is not applicable to direct discharge" };
  if (!Array.isArray(ducts) || ducts.length === 0) return { status: "REVIEW_REQUIRED", message: "Ducted arrangement has no calculated duct sections" };
  const complete = ducts.every((duct) => finitePositive(duct.airflowCfm) && finitePositive(duct.widthM) && finitePositive(duct.heightM));
  return status(complete, "Duct schedule contains required calculated dimensions and airflow", "One or more duct sections are incomplete");
};

const checkManufacturerData = (equipment) => {
  if (!equipment) return { status: "REVIEW_REQUIRED", message: "No selected equipment is available for manufacturer verification" };
  const hasManufacturer = Boolean(equipment.manufacturer);
  const hasModel = Boolean(equipment.model);
  return status(hasManufacturer && hasModel, "Manufacturer and model are identified", "Manufacturer or model data are missing");
};

const checkWeather = (criteria) => status(
  criteria.designConditionVerified === true,
  "Outdoor design condition is marked verified",
  "Outdoor design condition requires verification against the adopted weather source",
);

const checkOperatingCondition = (criteria) => status(
  criteria.operatingConditionConfirmed === true,
  "Equipment operating condition is confirmed",
  "Equipment operating condition requires confirmation",
);

const checkAcoustic = (criteria) => {
  if (criteria.acousticCriteriaRequired !== true) return { status: "NOT_REQUIRED", message: "Acoustic criteria not flagged for this project" };
  return status(criteria.acousticCriteriaVerified === true, "Acoustic criteria are verified", "Acoustic criteria require project-specific verification");
};

const checkRefrigerant = (equipment, criteria) => {
  const type = String(equipment?.type || "").toUpperCase();
  const dxLike = type.includes("DX") || type.includes("VRF") || Boolean(equipment?.refrigerant);
  if (!dxLike) return { status: "NOT_REQUIRED", message: "Refrigerant/piping review is not applicable to the identified equipment" };
  return status(
    criteria.refrigerantPipingVerified === true,
    "Refrigerant and piping verification is marked complete",
    "Refrigerant selection, pipe sizing/length and installation require verification",
  );
};

const checkSystem = (systemSummary) => {
  if (!systemSummary) return { status: "REVIEW_REQUIRED", message: "System arrangement has not been confirmed" };
  return status(
    systemSummary.status === "PASS",
    "System arrangement passes upstream selection checks",
    "System arrangement requires review of upstream selection checks",
  );
};

export const buildEngineeringReview = ({
  rooms = [],
  equipment = [],
  ducts = [],
  systemSummary = null,
  criteria = {},
}) => {
  const isDucted = String(criteria.distributionType || systemSummary?.distributionType || "").toUpperCase().includes("DUCT");
  const primaryEquipment = equipment[0] || null;

  const roomChecks = rooms.map((room) => ({
    roomId: room.roomId,
    roomName: room.roomName,
    coolingLoad: checkLoad(room),
    supplyAirflow: checkAirflow(room),
    ventilation: checkVentilation(room, criteria),
  }));

  const equipmentChecks = equipment.map((unit) => ({
    equipmentId: unit.equipmentId,
    capacity: checkEquipmentCapacity(unit),
    airflow: checkEquipmentAirflow(unit),
    esp: checkEsp(unit, isDucted),
    manufacturerData: checkManufacturerData(unit),
  }));

  const projectChecks = {
    ductCompleteness: checkDuctCompleteness(ducts, isDucted),
    weatherDesignCondition: checkWeather(criteria),
    operatingCondition: checkOperatingCondition(criteria),
    acousticCriteria: checkAcoustic(criteria),
    refrigerantPiping: checkRefrigerant(primaryEquipment, criteria),
    systemArrangement: checkSystem(systemSummary),
  };

  const checks = [
    ...roomChecks.flatMap((room) => [room.coolingLoad, room.supplyAirflow, room.ventilation]),
    ...equipmentChecks.flatMap((unit) => [unit.capacity, unit.airflow, unit.esp, unit.manufacturerData]),
    ...Object.values(projectChecks),
  ];
  const reviewRequired = checks.filter((item) => item.status === "REVIEW_REQUIRED").length;
  const failed = checks.filter((item) => item.status === "FAIL").length;

  return {
    version: "1.0",
    status: failed > 0 ? "FAIL" : reviewRequired > 0 ? "REVIEW_REQUIRED" : "PASS",
    summary: { totalChecks: checks.length, passed: checks.filter((item) => item.status === "PASS").length, reviewRequired, failed },
    roomChecks,
    equipmentChecks,
    projectChecks,
    methodology: "Calculated result → explicit design check → evidence requirement → engineering review status",
    boundary: "PASS means the supplied evidence satisfies the programmed check. REVIEW_REQUIRED means engineering evidence or project-specific verification is still required. The review does not replace code compliance, manufacturer certification, detailed coordination, TAB or commissioning.",
  };
};
