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

const assertArray = (value, name) => {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${name} must contain at least one item`);
};

const percentage = (value, base) => (base === 0 ? 0 : (value / base) * 100);

/**
 * Builds a room-by-room HVAC schedule from upstream cooling-load and airside results.
 * No engineering values are invented here. All values are supplied by the design engine.
 */
export const buildRoomSchedule = ({ rooms }) => {
  assertArray(rooms, "rooms");

  return rooms.map((room, index) => {
    const roomId = room.roomId ?? room.id;
    const roomName = room.roomName ?? room.name;
    if (typeof roomId !== "string" || roomId.trim() === "") throw new Error(`Room ${index + 1} requires roomId`);
    if (typeof roomName !== "string" || roomName.trim() === "") throw new Error(`Room ${roomId} requires roomName`);

    assertNonNegative(room.areaM2, `${roomId}.areaM2`);
    assertNonNegative(room.sensibleLoadKw, `${roomId}.sensibleLoadKw`);
    assertNonNegative(room.latentLoadKw, `${roomId}.latentLoadKw`);
    assertNonNegative(room.supplyAirflowCfm, `${roomId}.supplyAirflowCfm`);
    assertNonNegative(room.terminalCount, `${roomId}.terminalCount`);

    const totalLoadKw = room.totalLoadKw ?? room.sensibleLoadKw + room.latentLoadKw;
    assertNonNegative(totalLoadKw, `${roomId}.totalLoadKw`);

    return {
      roomId,
      roomName,
      areaM2: room.areaM2,
      sensibleLoadKw: room.sensibleLoadKw,
      latentLoadKw: room.latentLoadKw,
      totalLoadKw,
      sensibleHeatRatio: totalLoadKw === 0 ? 0 : room.sensibleLoadKw / totalLoadKw,
      supplyAirflowCfm: room.supplyAirflowCfm,
      terminalCount: room.terminalCount,
    };
  });
};

/**
 * Builds an equipment schedule. Capacity, airflow and ESP are selection outputs,
 * while required values come from the engineering design calculations.
 */
export const buildEquipmentSchedule = ({ equipment }) => {
  assertArray(equipment, "equipment");

  return equipment.map((unit, index) => {
    const equipmentId = unit.equipmentId ?? unit.id;
    if (typeof equipmentId !== "string" || equipmentId.trim() === "") throw new Error(`Equipment ${index + 1} requires equipmentId`);

    assertPositive(unit.capacityKw, `${equipmentId}.capacityKw`);
    assertNonNegative(unit.designAirflowCfm, `${equipmentId}.designAirflowCfm`);
    assertNonNegative(unit.requiredCapacityKw, `${equipmentId}.requiredCapacityKw`);
    assertNonNegative(unit.requiredEspPa, `${equipmentId}.requiredEspPa`);
    assertNonNegative(unit.selectedEspPa, `${equipmentId}.selectedEspPa`);

    const capacityMarginPercent = percentage(unit.capacityKw - unit.requiredCapacityKw, unit.requiredCapacityKw);
    const espMarginPercent = percentage(unit.selectedEspPa - unit.requiredEspPa, unit.requiredEspPa);

    return {
      equipmentId,
      systemId: unit.systemId ?? null,
      type: unit.type ?? null,
      indoorUnit: unit.indoorUnit ?? null,
      outdoorUnit: unit.outdoorUnit ?? null,
      capacityKw: unit.capacityKw,
      requiredCapacityKw: unit.requiredCapacityKw,
      capacityMarginPercent,
      designAirflowCfm: unit.designAirflowCfm,
      selectedAirflowCfm: unit.selectedAirflowCfm ?? unit.designAirflowCfm,
      requiredEspPa: unit.requiredEspPa,
      selectedEspPa: unit.selectedEspPa,
      espMarginPercent,
    };
  });
};

/**
 * Builds a duct schedule from sized duct segments.
 */
export const buildDuctSchedule = ({ ducts }) => {
  assertArray(ducts, "ducts");

  return ducts.map((duct, index) => {
    const ductId = duct.ductId ?? duct.id;
    if (typeof ductId !== "string" || ductId.trim() === "") throw new Error(`Duct ${index + 1} requires ductId`);

    assertNonNegative(duct.airflowCfm, `${ductId}.airflowCfm`);
    assertNonNegative(duct.velocityMps, `${ductId}.velocityMps`);
    assertNonNegative(duct.pressureLossPa, `${ductId}.pressureLossPa`);

    return {
      ductId,
      systemId: duct.systemId ?? null,
      sectionType: duct.sectionType ?? duct.type ?? null,
      airflowCfm: duct.airflowCfm,
      widthM: duct.widthM ?? null,
      heightM: duct.heightM ?? null,
      diameterM: duct.diameterM ?? null,
      velocityMps: duct.velocityMps,
      pressureLossPa: duct.pressureLossPa,
    };
  });
};

/**
 * Aggregates schedule values for the project/system summary.
 */
export const summarizeSchedules = ({ rooms, equipment, ducts }) => {
  assertArray(rooms, "rooms");
  assertArray(equipment, "equipment");
  assertArray(ducts, "ducts");

  return {
    roomCount: rooms.length,
    equipmentCount: equipment.length,
    ductCount: ducts.length,
    totalCoolingLoadKw: rooms.reduce((sum, room) => sum + room.totalLoadKw, 0),
    totalSensibleLoadKw: rooms.reduce((sum, room) => sum + room.sensibleLoadKw, 0),
    totalLatentLoadKw: rooms.reduce((sum, room) => sum + room.latentLoadKw, 0),
    totalSupplyAirflowCfm: rooms.reduce((sum, room) => sum + room.supplyAirflowCfm, 0),
    totalInstalledCapacityKw: equipment.reduce((sum, unit) => sum + unit.capacityKw, 0),
    totalDuctPressureLossPa: ducts.reduce((sum, duct) => sum + duct.pressureLossPa, 0),
  };
};
