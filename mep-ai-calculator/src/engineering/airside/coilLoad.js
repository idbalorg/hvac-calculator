import { AIR_CP_KJ_KG_K, STANDARD_AIR_DENSITY_KG_M3 } from "./airProperties.js";
import { moistAirEnthalpy } from "../psychrometrics/enthalpy.js";

/**
 * Coil load from entering and leaving moist-air states.
 * Total load is based on enthalpy difference. Sensible and latent are
 * reported separately using the dry-bulb sensible component and the balance.
 */
export const calculateCoilLoad = ({
  enteringAir,
  leavingAir,
  volumeFlowM3s,
  airDensityKgM3 = STANDARD_AIR_DENSITY_KG_M3,
  cpKJkgK = AIR_CP_KJ_KG_K,
}) => {
  if (volumeFlowM3s <= 0) throw new Error("Coil airflow must be positive.");
  if (airDensityKgM3 <= 0 || cpKJkgK <= 0) {
    throw new Error("Air density and specific heat must be positive.");
  }
  if (leavingAir.dryBulbC > enteringAir.dryBulbC) {
    throw new Error("Cooling-coil leaving-air dry bulb cannot exceed entering air.");
  }

  const enteringEnthalpy = enteringAir.enthalpyKJkg ?? moistAirEnthalpy(
    enteringAir.dryBulbC,
    enteringAir.humidityRatioKgKg,
  );
  const leavingEnthalpy = leavingAir.enthalpyKJkg ?? moistAirEnthalpy(
    leavingAir.dryBulbC,
    leavingAir.humidityRatioKgKg,
  );

  const dryAirMassFlowKgS = volumeFlowM3s * airDensityKgM3;
  const totalLoadW = dryAirMassFlowKgS * (enteringEnthalpy - leavingEnthalpy) * 1000;
  const sensibleLoadW =
    dryAirMassFlowKgS * cpKJkgK * (enteringAir.dryBulbC - leavingAir.dryBulbC) * 1000;
  const latentLoadW = totalLoadW - sensibleLoadW;

  return {
    enteringEnthalpyKJkg: enteringEnthalpy,
    leavingEnthalpyKJkg: leavingEnthalpy,
    dryAirMassFlowKgS,
    sensibleLoadW,
    latentLoadW: Math.max(0, latentLoadW),
    totalLoadW,
    totalLoadKW: totalLoadW / 1000,
    sensibleHeatRatio: totalLoadW > 0 ? sensibleLoadW / totalLoadW : 0,
  };
};
