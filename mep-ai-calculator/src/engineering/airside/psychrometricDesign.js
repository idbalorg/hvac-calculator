import { humidityRatioFromRelativeHumidity } from "../psychrometrics/humidityRatio.js";
import { moistAirEnthalpy } from "../psychrometrics/enthalpy.js";
import { calculateMixedAir } from "./mixedAir.js";
import { calculateCoilLoad } from "./coilLoad.js";

const STANDARD_PRESSURE_KPA = 101.325;
const DEFAULT_AIR_DENSITY_KG_M3 = 1.2;
const DEFAULT_CP_KJ_KG_K = 1.006;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Stage 13 airside design utilities. Inputs remain explicit so the designer
 * can choose the engineering basis rather than relying on hidden assumptions.
 */
export const calculateRoomSensibleHeatRatio = ({ sensibleLoadW, totalLoadW }) => {
  if (totalLoadW <= 0) return 0;
  return clamp(sensibleLoadW / totalLoadW, 0, 1);
};

export const calculateSupplyAirTemperature = ({ roomDryBulbC, roomSensibleLoadW, airflowM3s, airDensityKgM3 = DEFAULT_AIR_DENSITY_KG_M3, cpKJkgK = DEFAULT_CP_KJ_KG_K }) => {
  if (airflowM3s <= 0) throw new Error("Supply airflow must be positive.");
  if (airDensityKgM3 <= 0 || cpKJkgK <= 0) throw new Error("Air density and specific heat must be positive.");
  const massFlowKgS = airflowM3s * airDensityKgM3;
  const deltaT = roomSensibleLoadW / (massFlowKgS * cpKJkgK * 1000);
  return { supplyDryBulbC: roomDryBulbC - deltaT, deltaTC: deltaT, massFlowKgS };
};

export const calculateSupplyAirflow = ({ roomSensibleLoadW, roomDryBulbC, supplyDryBulbC, airDensityKgM3 = DEFAULT_AIR_DENSITY_KG_M3, cpKJkgK = DEFAULT_CP_KJ_KG_K }) => {
  if (supplyDryBulbC >= roomDryBulbC) throw new Error("Supply-air dry bulb must be below room dry bulb for cooling.");
  if (airDensityKgM3 <= 0 || cpKJkgK <= 0) throw new Error("Air density and specific heat must be positive.");
  const deltaT = roomDryBulbC - supplyDryBulbC;
  const airflowM3s = roomSensibleLoadW / (airDensityKgM3 * cpKJkgK * 1000 * deltaT);
  return { airflowM3s, airflowM3h: airflowM3s * 3600, airflowLps: airflowM3s * 1000, deltaTC: deltaT };
};

export const calculateAirState = ({ dryBulbC, relativeHumidityPercent, pressureKPa = STANDARD_PRESSURE_KPA }) => {
  const humidityRatioKgKg = humidityRatioFromRelativeHumidity(dryBulbC, relativeHumidityPercent, pressureKPa);
  return { dryBulbC, relativeHumidityPercent, humidityRatioKgKg, enthalpyKJkg: moistAirEnthalpy(dryBulbC, humidityRatioKgKg) };
};

export const calculateMixedAirsideState = ({ returnAir, outdoorAir, outdoorAirflowM3s, supplyAirflowM3s, pressureKPa = STANDARD_PRESSURE_KPA }) => {
  if (outdoorAirflowM3s < 0 || supplyAirflowM3s <= 0 || outdoorAirflowM3s > supplyAirflowM3s) throw new Error("Outdoor and supply airflow relationship is invalid.");
  const outdoorAirFraction = outdoorAirflowM3s / supplyAirflowM3s;
  return calculateMixedAir({ returnAir, outdoorAir, outdoorAirFraction, pressureKPa });
};

export const calculateAirsideDesign = ({ roomLoad, roomDryBulbC, roomRelativeHumidityPercent, supplyDryBulbC, outdoorAirflowM3s = 0, outdoorAirState, pressureKPa = STANDARD_PRESSURE_KPA, airDensityKgM3 = DEFAULT_AIR_DENSITY_KG_M3, cpKJkgK = DEFAULT_CP_KJ_KG_K, coolingCoilLeavingRHPercent = 90 }) => {
  if (!roomLoad || roomLoad.sensibleLoadW <= 0 || roomLoad.totalLoadW <= 0) throw new Error("Positive room sensible and total cooling loads are required.");
  const airflow = calculateSupplyAirflow({ roomSensibleLoadW: roomLoad.sensibleLoadW, roomDryBulbC, supplyDryBulbC, airDensityKgM3, cpKJkgK });
  const roomAir = calculateAirState({ dryBulbC: roomDryBulbC, relativeHumidityPercent: roomRelativeHumidityPercent, pressureKPa });
  const outdoorAir = outdoorAirState ? calculateAirState({ ...outdoorAirState, pressureKPa }) : null;
  const mixedAir = outdoorAir && outdoorAirflowM3s > 0 ? calculateMixedAirsideState({ returnAir: roomAir, outdoorAir, outdoorAirflowM3s, supplyAirflowM3s: airflow.airflowM3s, pressureKPa }) : roomAir;
  const leavingAir = calculateAirState({ dryBulbC: supplyDryBulbC, relativeHumidityPercent: coolingCoilLeavingRHPercent, pressureKPa });
  const coil = calculateCoilLoad({ enteringAir: mixedAir, leavingAir, volumeFlowM3s: airflow.airflowM3s, airDensityKgM3, cpKJkgK });
  return { roomAir, outdoorAir, mixedAir, leavingAir, airflow, sensibleHeatRatio: calculateRoomSensibleHeatRatio(roomLoad), coil };
};
