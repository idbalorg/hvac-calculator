/**
 * Mechanical outdoor-air ventilation calculations.
 *
 * Airflow is expressed in L/s at the room/system level.
 * Cooling loads are calculated from the outdoor/indoor psychrometric states.
 *
 * The people + area airflow method is intentionally generic. Rp and Ra must
 * come from the selected ventilation standard/zone category. This module
 * does not claim blanket ASHRAE 62.1 compliance by itself.
 */

import { humidityRatioFromRelativeHumidity } from "../psychrometrics/humidityRatio";
import { moistAirEnthalpy } from "../psychrometrics/enthalpy";

const DEFAULT_AIR_DENSITY_KG_M3 = 1.2;
const DEFAULT_CP_AIR_J_KG_K = 1006;

const assertNonNegative = (value, label) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
};

const assertPositive = (value, label) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
};

/**
 * Calculate required outdoor airflow using the people + area method:
 * Voa = N*Rp + A*Ra
 *
 * Rp: L/s-person
 * Ra: L/s-m²
 */
export const calculateOutdoorAirflow = ({
  people,
  areaM2,
  outdoorAirPerPersonLps,
  outdoorAirPerAreaLpsM2,
  effectiveness = 1,
}) => {
  assertNonNegative(people, "People count");
  assertNonNegative(areaM2, "Area");
  assertNonNegative(outdoorAirPerPersonLps, "Outdoor air per person");
  assertNonNegative(outdoorAirPerAreaLpsM2, "Outdoor air per area");
  assertPositive(effectiveness, "Ventilation effectiveness");

  const peopleComponentLps = people * outdoorAirPerPersonLps;
  const areaComponentLps = areaM2 * outdoorAirPerAreaLpsM2;
  const requiredOutdoorAirLps = (peopleComponentLps + areaComponentLps) / effectiveness;

  return {
    peopleComponentLps,
    areaComponentLps,
    requiredOutdoorAirLps,
    requiredOutdoorAirM3s: requiredOutdoorAirLps / 1000,
  };
};

/**
 * Calculate ventilation cooling load from indoor/outdoor dry-bulb and RH.
 * Returns sensible, latent and total cooling loads in watts.
 *
 * The total load is based on dry-air mass flow and enthalpy difference.
 * Sensible load is based on moist-air mass flow and cp*delta-T.
 * Latent load is the remaining total load.
 */
export const calculateVentilationLoad = ({
  outdoorAirLps,
  indoorDryBulbC,
  indoorRelativeHumidityPercent,
  outdoorDryBulbC,
  outdoorRelativeHumidityPercent,
  pressureKPa = 101.325,
  airDensityKgM3 = DEFAULT_AIR_DENSITY_KG_M3,
  cpAirJKgK = DEFAULT_CP_AIR_J_KG_K,
}) => {
  assertNonNegative(outdoorAirLps, "Outdoor airflow");
  assertPositive(airDensityKgM3, "Air density");
  assertPositive(cpAirJKgK, "Air specific heat");
  assertPositive(pressureKPa, "Atmospheric pressure");

  if (outdoorAirLps === 0) {
    return {
      airflowLps: 0,
      airflowM3s: 0,
      sensibleW: 0,
      latentW: 0,
      totalW: 0,
      indoorHumidityRatio: humidityRatioFromRelativeHumidity(
        indoorDryBulbC,
        indoorRelativeHumidityPercent,
        pressureKPa,
      ),
      outdoorHumidityRatio: humidityRatioFromRelativeHumidity(
        outdoorDryBulbC,
        outdoorRelativeHumidityPercent,
        pressureKPa,
      ),
    };
  }

  const airflowM3s = outdoorAirLps / 1000;
  const indoorHumidityRatio = humidityRatioFromRelativeHumidity(
    indoorDryBulbC,
    indoorRelativeHumidityPercent,
    pressureKPa,
  );
  const outdoorHumidityRatio = humidityRatioFromRelativeHumidity(
    outdoorDryBulbC,
    outdoorRelativeHumidityPercent,
    pressureKPa,
  );

  const indoorEnthalpy = moistAirEnthalpy(indoorDryBulbC, indoorHumidityRatio);
  const outdoorEnthalpy = moistAirEnthalpy(outdoorDryBulbC, outdoorHumidityRatio);

  const moistAirMassFlowKgS = airDensityKgM3 * airflowM3s;
  const dryAirMassFlowKgS = moistAirMassFlowKgS / (1 + outdoorHumidityRatio);

  const sensibleW = Math.max(
    0,
    moistAirMassFlowKgS * cpAirJKgK * (outdoorDryBulbC - indoorDryBulbC),
  );
  const totalW = Math.max(0, dryAirMassFlowKgS * 1000 * (outdoorEnthalpy - indoorEnthalpy));
  const latentW = Math.max(0, totalW - sensibleW);

  return {
    airflowLps: outdoorAirLps,
    airflowM3s,
    sensibleW,
    latentW,
    totalW: sensibleW + latentW,
    indoorHumidityRatio,
    outdoorHumidityRatio,
    indoorEnthalpyKJkg: indoorEnthalpy,
    outdoorEnthalpyKJkg: outdoorEnthalpy,
    moistAirMassFlowKgS,
    dryAirMassFlowKgS,
  };
};

/**
 * Combined convenience function for a people + area outdoor-air requirement
 * followed by its ventilation cooling load.
 */
export const calculateVentilation = ({
  people,
  areaM2,
  outdoorAirPerPersonLps,
  outdoorAirPerAreaLpsM2,
  effectiveness = 1,
  ...loadInputs
}) => {
  const airflow = calculateOutdoorAirflow({
    people,
    areaM2,
    outdoorAirPerPersonLps,
    outdoorAirPerAreaLpsM2,
    effectiveness,
  });

  return {
    airflow,
    load: calculateVentilationLoad({
      outdoorAirLps: airflow.requiredOutdoorAirLps,
      ...loadInputs,
    }),
  };
};
