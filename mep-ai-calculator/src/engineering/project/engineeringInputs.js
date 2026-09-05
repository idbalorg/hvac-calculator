/**
 * Stage 12 engineering input model.
 * Keeps engineering assumptions/data separate from UI and calculation engines.
 */
export const ENGINEERING_INPUT_VERSION = "12.0.0";
export const DEFAULT_ENGINEERING_INPUTS = Object.freeze({
  wall: { uValueWm2K: 0.50, cltdK: 8, orientation: "all", construction: "Preliminary wall construction" },
  roof: { uValueWm2K: 0.40, cltdK: 10, construction: "Preliminary roof construction" },
  windows: { uValueWm2K: 2.80, cltdK: 6, shgc: 0.40, solarIrradianceWm2: 250, shadingFactor: 1, orientation: "all", glazing: "Preliminary glazing" },
  people: { sensibleHeatWPerPerson: 75, latentHeatWPerPerson: 55, diversityFactor: 1, activity: "Preliminary occupancy activity" },
  lighting: { powerDensityWm2: 10, useFactor: 1, ballastFactor: 1 },
  equipment: { defaultUseFactor: 1, items: [] },
  ventilation: { enabled: false, standard: "Project-specified ventilation basis", zoneCategory: "", outdoorAirPerPersonLps: 0, outdoorAirPerAreaLpsM2: 0, effectiveness: 1 },
  infiltration: { enabled: false, method: "ACH", airChangesPerHour: 0, airflowLps: 0 },
});
const clone = (value) => JSON.parse(JSON.stringify(value));
const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const createEquipmentItem = (overrides = {}) => ({ id: overrides.id || `EQ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: overrides.name || "Equipment", quantity: numberOr(overrides.quantity, 1), sensibleWatts: numberOr(overrides.sensibleWatts, 0), latentWatts: numberOr(overrides.latentWatts, 0), useFactor: numberOr(overrides.useFactor, 1) });

export const createEngineeringInputs = (overrides = {}) => {
  const base = clone(DEFAULT_ENGINEERING_INPUTS);
  const result = { ...base, ...overrides, wall: { ...base.wall, ...(overrides.wall || {}) }, roof: { ...base.roof, ...(overrides.roof || {}) }, windows: { ...base.windows, ...(overrides.windows || {}) }, people: { ...base.people, ...(overrides.people || {}) }, lighting: { ...base.lighting, ...(overrides.lighting || {}) }, equipment: { ...base.equipment, ...(overrides.equipment || {}) }, ventilation: { ...base.ventilation, ...(overrides.ventilation || {}) }, infiltration: { ...base.infiltration, ...(overrides.infiltration || {}) } };
  result.equipment.items = (result.equipment.items || []).map(createEquipmentItem);
  return result;
};

export const normalizeEngineeringInputs = (inputs = {}) => {
  const result = createEngineeringInputs(inputs);
  result.wall.uValueWm2K = numberOr(result.wall.uValueWm2K, 0.50); result.wall.cltdK = numberOr(result.wall.cltdK, 8);
  result.roof.uValueWm2K = numberOr(result.roof.uValueWm2K, 0.40); result.roof.cltdK = numberOr(result.roof.cltdK, 10);
  result.windows.uValueWm2K = numberOr(result.windows.uValueWm2K, 2.80); result.windows.cltdK = numberOr(result.windows.cltdK, 6); result.windows.shgc = clamp(numberOr(result.windows.shgc, 0.40), 0, 1); result.windows.solarIrradianceWm2 = numberOr(result.windows.solarIrradianceWm2, 250); result.windows.shadingFactor = clamp(numberOr(result.windows.shadingFactor, 1), 0, 1);
  result.people.sensibleHeatWPerPerson = numberOr(result.people.sensibleHeatWPerPerson, 75); result.people.latentHeatWPerPerson = numberOr(result.people.latentHeatWPerPerson, 55); result.people.diversityFactor = clamp(numberOr(result.people.diversityFactor, 1), 0, 1);
  result.lighting.powerDensityWm2 = numberOr(result.lighting.powerDensityWm2, 10); result.lighting.useFactor = clamp(numberOr(result.lighting.useFactor, 1), 0, 1); result.lighting.ballastFactor = numberOr(result.lighting.ballastFactor, 1);
  result.equipment.defaultUseFactor = clamp(numberOr(result.equipment.defaultUseFactor, 1), 0, 1); result.equipment.items = (result.equipment.items || []).map(createEquipmentItem);
  result.ventilation.outdoorAirPerPersonLps = numberOr(result.ventilation.outdoorAirPerPersonLps, 0); result.ventilation.outdoorAirPerAreaLpsM2 = numberOr(result.ventilation.outdoorAirPerAreaLpsM2, 0); result.ventilation.effectiveness = numberOr(result.ventilation.effectiveness, 1);
  result.infiltration.airChangesPerHour = numberOr(result.infiltration.airChangesPerHour, 0); result.infiltration.airflowLps = numberOr(result.infiltration.airflowLps, 0);
  return result;
};

export const validateEngineeringInputs = (inputs) => {
  if (!inputs || typeof inputs !== "object") return ["Engineering inputs are required."];
  const errors = [];
  const raw = inputs;
  const constrained = [[raw.windows?.shgc, "Window SHGC", 0, 1], [raw.windows?.shadingFactor, "Window shading factor", 0, 1], [raw.people?.diversityFactor, "People diversity factor", 0, 1], [raw.lighting?.useFactor, "Lighting use factor", 0, 1], [raw.equipment?.defaultUseFactor, "Equipment default use factor", 0, 1]];
  constrained.forEach(([value, label, min, max]) => { if (value !== undefined && value !== null && (Number.isNaN(Number(value)) || Number(value) < min || Number(value) > max)) errors.push(`${label} must be between ${min} and ${max}.`); });
  const nonNegative = [[raw.wall?.uValueWm2K,"Wall U-value"],[raw.wall?.cltdK,"Wall CLTD"],[raw.roof?.uValueWm2K,"Roof U-value"],[raw.roof?.cltdK,"Roof CLTD"],[raw.windows?.uValueWm2K,"Window U-value"],[raw.windows?.cltdK,"Window CLTD"],[raw.windows?.solarIrradianceWm2,"Solar irradiance"],[raw.people?.sensibleHeatWPerPerson,"Sensible heat/person"],[raw.people?.latentHeatWPerPerson,"Latent heat/person"],[raw.lighting?.powerDensityWm2,"Lighting power density"],[raw.lighting?.ballastFactor,"Ballast factor"],[raw.ventilation?.outdoorAirPerPersonLps,"Outdoor air/person"],[raw.ventilation?.outdoorAirPerAreaLpsM2,"Outdoor air/area"],[raw.infiltration?.airChangesPerHour,"Infiltration ACH"],[raw.infiltration?.airflowLps,"Infiltration airflow"]];
  nonNegative.forEach(([value, label]) => { if (value !== undefined && value !== null && (Number.isNaN(Number(value)) || Number(value) < 0)) errors.push(`${label} must be non-negative.`); });
  if (raw.ventilation?.effectiveness !== undefined && Number(raw.ventilation.effectiveness) <= 0) errors.push("Ventilation effectiveness must be greater than zero.");
  (raw.equipment?.items || []).forEach((item, i) => { if (Number(item.quantity) < 0) errors.push(`Equipment ${i + 1} quantity must be non-negative.`); if (Number(item.sensibleWatts) < 0 || Number(item.latentWatts) < 0) errors.push(`Equipment ${i + 1} heat gains must be non-negative.`); if (Number(item.useFactor) < 0 || Number(item.useFactor) > 1) errors.push(`Equipment ${i + 1} use factor must be between 0 and 1.`); });
  return errors;
};

export const buildEngineeringInputsForRoom = ({ room, designConditions, inputs }) => {
  if (!room) throw new Error("Room is required.");
  if (!designConditions?.selectedCoolingCondition || !designConditions?.indoor) throw new Error("Design conditions are required.");
  const errors = validateEngineeringInputs(inputs); if (errors.length) throw new Error(errors[0]);
  const n = normalizeEngineeringInputs(inputs); const outdoor = designConditions.selectedCoolingCondition; const indoor = designConditions.indoor; const outdoorRh = designConditions.outdoor.relativeHumidityPercent;
  if (!Number.isFinite(outdoorRh)) throw new Error("Outdoor relative humidity is required for psychrometric ventilation/infiltration calculations.");
  const wallArea = Math.max(0, 2 * room.height * (room.length + room.width) - (room.windowAreaM2 || 0)); const windowArea = Math.max(0, room.windowAreaM2 || 0);
  const equipmentItems = n.equipment.items.length ? n.equipment.items : (room.equipmentLoadKw > 0 ? [createEquipmentItem({ name: "Room equipment allowance", quantity: 1, sensibleWatts: room.equipmentLoadKw * 1000, latentWatts: 0 })] : []);
  return {
    walls: { area: wallArea, uValue: n.wall.uValueWm2K, cltd: n.wall.cltdK, correctedCltd: n.wall.cltdK, orientation: n.wall.orientation, construction: n.wall.construction },
    roof: { area: room.length * room.width, uValue: n.roof.uValueWm2K, cltd: n.roof.cltdK, correctedCltd: n.roof.cltdK, construction: n.roof.construction },
    windows: { area: windowArea, uValue: n.windows.uValueWm2K, cltd: n.windows.cltdK, correctedCltd: n.windows.cltdK, shgc: n.windows.shgc, solarIrradiance: n.windows.solarIrradianceWm2, shadingFactor: n.windows.shadingFactor, orientation: n.windows.orientation, glazing: n.windows.glazing },
    people: { sensibleHeatPerPerson: n.people.sensibleHeatWPerPerson, latentHeatPerPerson: n.people.latentHeatWPerPerson, diversityFactor: n.people.diversityFactor, activity: n.people.activity },
    lighting: { powerDensity: n.lighting.powerDensityWm2, useFactor: n.lighting.useFactor, ballastFactor: n.lighting.ballastFactor },
    equipment: { items: equipmentItems, defaultUseFactor: n.equipment.defaultUseFactor },
    ventilation: n.ventilation.enabled ? { outdoorAirPerPersonLps: n.ventilation.outdoorAirPerPersonLps, outdoorAirPerAreaLpsM2: n.ventilation.outdoorAirPerAreaLpsM2, effectiveness: n.ventilation.effectiveness, indoorDryBulbC: indoor.dryBulbC, indoorRelativeHumidityPercent: indoor.relativeHumidityPercent, outdoorDryBulbC: outdoor.dryBulbC, outdoorRelativeHumidityPercent: outdoorRh } : null,
    infiltration: n.infiltration.enabled ? { infiltrationAirLps: n.infiltration.method === "AIRFLOW" ? n.infiltration.airflowLps : room.length * room.width * room.height * n.infiltration.airChangesPerHour * 1000 / 3600, indoorDryBulbC: indoor.dryBulbC, indoorRelativeHumidityPercent: indoor.relativeHumidityPercent, outdoorDryBulbC: outdoor.dryBulbC, outdoorRelativeHumidityPercent: outdoorRh } : null,
    metadata: { version: ENGINEERING_INPUT_VERSION, source: "project-engineering-input-model" },
  };
};
