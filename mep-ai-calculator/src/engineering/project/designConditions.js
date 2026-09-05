/**
 * Project design-condition foundation.
 *
 * Climate values are reference data, not universal constants. Each dataset
 * carries its source and edition so the calculation can be audited and updated
 * when a newer licensed/reference dataset is selected.
 */

const assertFinite = (value, name) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
};
const assertPositive = (value, name) => { assertFinite(value, name); if (value <= 0) throw new Error(`${name} must be greater than zero`); };
const assertRelativeHumidity = (value, name) => { assertFinite(value, name); if (value < 0 || value > 100) throw new Error(`${name} must be between 0 and 100`); };
const clone = (value) => JSON.parse(JSON.stringify(value));

/** ASHRAE 2021 Chapter 14 reference point for Lagos Ikeja. */
export const DESIGN_CONDITIONS = {
  LAGOS_IKEJA_ASHRAE_2021: {
    id: "LAGOS_IKEJA_ASHRAE_2021", location: "Lagos Ikeja", country: "Nigeria",
    latitude: 6.58, longitude: 3.32, elevationM: 41, station: "652010", climateZone: "0A",
    source: "ASHRAE Handbook - Fundamentals, 2021, Chapter 14", sourceEdition: 2021,
    cooling: { designBasis: "annual cumulative frequency", db: {
      percentile04: { dryBulbC: 34.8, meanCoincidentWetBulbC: 25.9 },
      percentile1: { dryBulbC: 34.1, meanCoincidentWetBulbC: 26.1 },
      percentile2: { dryBulbC: 33.7, meanCoincidentWetBulbC: 26.2 },
    }, wetBulb: {
      percentile04: { wetBulbC: 28.3, meanCoincidentDryBulbC: 32.0 },
      percentile1: { wetBulbC: 27.9, meanCoincidentDryBulbC: 31.7 },
      percentile2: { wetBulbC: 27.2, meanCoincidentDryBulbC: 31.7 },
    } },
  },
};

export const getDesignCondition = (id) => { const condition = DESIGN_CONDITIONS[id]; if (!condition) throw new Error(`Unknown design condition: ${id}`); return clone(condition); };

export const validateDesignCondition = (condition) => {
  if (!condition || typeof condition !== "object") throw new Error("Design condition is required");
  if (typeof condition.id !== "string" || condition.id.trim() === "") throw new Error("Design condition id is required");
  if (typeof condition.location !== "string" || condition.location.trim() === "") throw new Error("Design condition location is required");
  if (typeof condition.country !== "string" || condition.country.trim() === "") throw new Error("Design condition country is required");
  assertFinite(condition.latitude, "latitude"); assertFinite(condition.longitude, "longitude"); assertFinite(condition.elevationM, "elevationM"); assertFinite(condition.sourceEdition, "sourceEdition");
  [condition.cooling?.db?.percentile04, condition.cooling?.db?.percentile1, condition.cooling?.db?.percentile2].forEach((entry, index) => { if (!entry) throw new Error(`Cooling DB condition ${index + 1} is required`); assertFinite(entry.dryBulbC, "dryBulbC"); assertFinite(entry.meanCoincidentWetBulbC, "meanCoincidentWetBulbC"); });
  return true;
};

export const buildIndoorDesignCondition = ({ dryBulbC = 24, relativeHumidityPercent = 50 }) => {
  assertFinite(dryBulbC, "Indoor dry-bulb temperature"); assertRelativeHumidity(relativeHumidityPercent, "Indoor relative humidity");
  return { dryBulbC, relativeHumidityPercent };
};

export const buildProjectDesignConditions = ({
  outdoorConditionId, coolingPercentile = "percentile04", indoorDryBulbC = 24,
  indoorRelativeHumidityPercent = 50, outdoorRelativeHumidityPercent = null,
}) => {
  const outdoor = getDesignCondition(outdoorConditionId); validateDesignCondition(outdoor);
  const selected = outdoor.cooling.db[coolingPercentile]; if (!selected) throw new Error(`Unsupported cooling percentile: ${coolingPercentile}`);
  if (outdoorRelativeHumidityPercent !== null && outdoorRelativeHumidityPercent !== undefined) {
    assertRelativeHumidity(outdoorRelativeHumidityPercent, "Outdoor relative humidity");
    outdoor.relativeHumidityPercent = outdoorRelativeHumidityPercent;
  }
  return { outdoor, selectedCoolingCondition: { percentile: coolingPercentile, dryBulbC: selected.dryBulbC, meanCoincidentWetBulbC: selected.meanCoincidentWetBulbC }, indoor: buildIndoorDesignCondition({ dryBulbC: indoorDryBulbC, relativeHumidityPercent: indoorRelativeHumidityPercent }) };
};

export const listDesignConditions = () => Object.values(DESIGN_CONDITIONS).map(clone);
export const validateDesignConditionSelection = ({ outdoorConditionId, coolingPercentile }) => {
  if (typeof outdoorConditionId !== "string" || outdoorConditionId.trim() === "") throw new Error("outdoorConditionId is required");
  if (!["percentile04", "percentile1", "percentile2"].includes(coolingPercentile)) throw new Error(`Unsupported cooling percentile: ${coolingPercentile}`);
  getDesignCondition(outdoorConditionId); return true;
};
