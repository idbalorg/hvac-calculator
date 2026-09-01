import {
  AIR_CP_KJ_KG_K,
  STANDARD_AIR_DENSITY_KG_M3,
} from "./airProperties.js";
import { humidityRatioFromRelativeHumidity } from "../psychrometrics/humidityRatio.js";
import { moistAirEnthalpy } from "../psychrometrics/enthalpy.js";

/**
 * Calculate supply airflow from room sensible load.
 * Qs = rho * Vdot * cp * (Troom - Tsupply)
 * Qs is W, temperatures are °C, airflow is m³/s.
 */
export const calculateSupplyAirflow = ({
  sensibleLoadW,
  roomDryBulbC,
  supplyDryBulbC,
  airDensityKgM3 = STANDARD_AIR_DENSITY_KG_M3,
  cpKJkgK = AIR_CP_KJ_KG_K,
}) => {
  if (sensibleLoadW < 0) throw new Error("Sensible load cannot be negative.");
  if (supplyDryBulbC >= roomDryBulbC) {
    throw new Error("Supply-air dry bulb must be below room dry bulb for cooling.");
  }
  if (airDensityKgM3 <= 0 || cpKJkgK <= 0) {
    throw new Error("Air density and specific heat must be positive.");
  }

  const deltaT = roomDryBulbC - supplyDryBulbC;
  const volumeFlowM3s = sensibleLoadW / (airDensityKgM3 * cpKJkgK * 1000 * deltaT);
  const massFlowKgDryAirS = volumeFlowM3s * airDensityKgM3;

  return {
    volumeFlowM3s,
    volumeFlowM3h: volumeFlowM3s * 3600,
    cfm: volumeFlowM3s * 2118.88,
    massFlowKgDryAirS,
    deltaT,
  };
};

/**
 * Estimate the supply-air humidity ratio required to satisfy a room latent load.
 * This is a room moisture-balance calculation, not a coil apparatus-dew-point calculation.
 */
export const calculateSupplyHumidityRatio = ({
  roomHumidityRatio,
  latentLoadW,
  dryAirMassFlowKgS,
}) => {
  if (latentLoadW < 0) throw new Error("Latent load cannot be negative.");
  if (dryAirMassFlowKgS <= 0) throw new Error("Dry-air mass flow must be positive.");

  return roomHumidityRatio - latentLoadW / (dryAirMassFlowKgS * 2501 * 1000);
};

export const calculateSupplyAirState = ({
  sensibleLoadW,
  latentLoadW = 0,
  roomDryBulbC,
  roomRelativeHumidityPercent,
  supplyDryBulbC,
  pressureKPa = 101.325,
  airDensityKgM3 = STANDARD_AIR_DENSITY_KG_M3,
  cpKJkgK = AIR_CP_KJ_KG_K,
}) => {
  const roomHumidityRatio = humidityRatioFromRelativeHumidity(
    roomDryBulbC,
    roomRelativeHumidityPercent,
    pressureKPa,
  );

  const airflow = calculateSupplyAirflow({
    sensibleLoadW,
    roomDryBulbC,
    supplyDryBulbC,
    airDensityKgM3,
    cpKJkgK,
  });

  const supplyHumidityRatio = calculateSupplyHumidityRatio({
    roomHumidityRatio,
    latentLoadW,
    dryAirMassFlowKgS: airflow.massFlowKgDryAirS,
  });

  const supplyEnthalpy = moistAirEnthalpy(supplyDryBulbC, supplyHumidityRatio);

  return {
    ...airflow,
    dryBulbC: supplyDryBulbC,
    humidityRatioKgKg: supplyHumidityRatio,
    enthalpyKJkg: supplyEnthalpy,
  };
};
