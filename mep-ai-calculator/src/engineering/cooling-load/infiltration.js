/**
 * Infiltration cooling-load calculations.
 *
 * This module treats infiltration separately from mechanical ventilation.
 * Airflow may be entered directly or derived from room volume and ACH.
 *
 * Loads are calculated from the indoor/outdoor moist-air states:
 *   sensible = m_dot_air * cp * (To - Ti)
 *   total    = m_dot_dry_air * (ho - hi)
 *   latent   = total - sensible
 *
 * Positive loads represent cooling required from warmer/more humid outdoor air.
 */

import { humidityRatioFromRelativeHumidity } from "../psychrometrics/humidityRatio";
import { moistAirEnthalpy } from "../psychrometrics/enthalpy";

const AIR_DENSITY_KG_M3 = 1.2;
const CP_AIR_KJ_KG_K = 1.006;
const DRY_AIR_FACTOR = 1;

const assertNonNegative = (value, label) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number.`);
  }
};

const assertPositive = (value, label) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite number greater than zero.`);
  }
};

/**
 * Calculate infiltration airflow from room volume and air changes per hour.
 * Returns both m3/h and L/s.
 */
export const calculateInfiltrationAirflow = ({
  roomVolumeM3,
  airChangesPerHour,
}) => {
  assertPositive(roomVolumeM3, "Room volume");
  assertNonNegative(airChangesPerHour, "Air changes per hour");

  const airflowM3PerHour = roomVolumeM3 * airChangesPerHour;
  const airflowLps = (airflowM3PerHour * 1000) / 3600;

  return {
    roomVolumeM3,
    airChangesPerHour,
    airflowM3PerHour,
    airflowLps,
  };
};

/**
 * Calculate infiltration sensible, latent and total cooling loads.
 * Outdoor and indoor states are defined by dry-bulb temperature and RH.
 */
export const calculateInfiltrationLoad = ({
  infiltrationAirLps,
  indoorDryBulbC,
  indoorRelativeHumidityPercent,
  outdoorDryBulbC,
  outdoorRelativeHumidityPercent,
  pressureKPa = 101.325,
}) => {
  assertNonNegative(infiltrationAirLps, "Infiltration airflow");
  assertPositive(pressureKPa, "Atmospheric pressure");

  const values = [
    [indoorDryBulbC, "Indoor dry-bulb temperature"],
    [outdoorDryBulbC, "Outdoor dry-bulb temperature"],
    [indoorRelativeHumidityPercent, "Indoor relative humidity"],
    [outdoorRelativeHumidityPercent, "Outdoor relative humidity"],
  ];

  values.forEach(([value, label]) => {
    if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
  });

  if (indoorRelativeHumidityPercent < 0 || indoorRelativeHumidityPercent > 100) {
    throw new Error("Indoor relative humidity must be between 0 and 100%.");
  }
  if (outdoorRelativeHumidityPercent < 0 || outdoorRelativeHumidityPercent > 100) {
    throw new Error("Outdoor relative humidity must be between 0 and 100%.");
  }

  const indoorW = humidityRatioFromRelativeHumidity(
    indoorDryBulbC,
    indoorRelativeHumidityPercent,
    pressureKPa,
  );
  const outdoorW = humidityRatioFromRelativeHumidity(
    outdoorDryBulbC,
    outdoorRelativeHumidityPercent,
    pressureKPa,
  );

  const indoorH = moistAirEnthalpy(indoorDryBulbC, indoorW);
  const outdoorH = moistAirEnthalpy(outdoorDryBulbC, outdoorW);

  const airflowM3PerS = infiltrationAirLps / 1000;
  const moistAirMassFlowKgS = AIR_DENSITY_KG_M3 * airflowM3PerS;
  const dryAirMassFlowKgS = moistAirMassFlowKgS / (1 + outdoorW);

  const sensibleW =
    moistAirMassFlowKgS * CP_AIR_KJ_KG_K * (outdoorDryBulbC - indoorDryBulbC) * 1000;

  const totalW =
    dryAirMassFlowKgS * (outdoorH - indoorH) * 1000 * DRY_AIR_FACTOR;

  const latentW = totalW - sensibleW;

  return {
    infiltrationAirLps,
    airflowM3PerS,
    moistAirMassFlowKgS,
    dryAirMassFlowKgS,
    indoorHumidityRatio: indoorW,
    outdoorHumidityRatio: outdoorW,
    indoorEnthalpyKJKg: indoorH,
    outdoorEnthalpyKJKg: outdoorH,
    sensibleW,
    latentW,
    totalW,
  };
};
