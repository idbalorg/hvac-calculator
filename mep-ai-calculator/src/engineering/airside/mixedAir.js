import { moistAirEnthalpy } from "../psychrometrics/enthalpy.js";
import { humidityRatioFromRelativeHumidity } from "../psychrometrics/humidityRatio.js";

/**
 * Mix return air and outdoor air on a dry-air mass basis.
 * The two input states must use the same pressure basis.
 */
export const calculateMixedAir = ({
  returnAir,
  outdoorAir,
  outdoorAirFraction,
  pressureKPa = 101.325,
}) => {
  if (outdoorAirFraction < 0 || outdoorAirFraction > 1) {
    throw new Error("Outdoor-air fraction must be between 0 and 1.");
  }

  const returnW = returnAir.humidityRatioKgKg ?? humidityRatioFromRelativeHumidity(
    returnAir.dryBulbC,
    returnAir.relativeHumidityPercent,
    pressureKPa,
  );
  const outdoorW = outdoorAir.humidityRatioKgKg ?? humidityRatioFromRelativeHumidity(
    outdoorAir.dryBulbC,
    outdoorAir.relativeHumidityPercent,
    pressureKPa,
  );

  const f = outdoorAirFraction;
  const dryBulbC = (1 - f) * returnAir.dryBulbC + f * outdoorAir.dryBulbC;
  const humidityRatioKgKg = (1 - f) * returnW + f * outdoorW;
  const enthalpyKJkg = moistAirEnthalpy(dryBulbC, humidityRatioKgKg);

  return {
    dryBulbC,
    humidityRatioKgKg,
    enthalpyKJkg,
    outdoorAirFraction: f,
  };
};
