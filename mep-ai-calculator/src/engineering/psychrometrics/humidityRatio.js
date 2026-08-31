const STANDARD_ATMOSPHERIC_PRESSURE_KPA = 101.325;

/**
 * Saturation vapor pressure using the Magnus approximation.
 * Suitable for normal HVAC design temperatures.
 */
export const saturationVaporPressure = (dryBulbC) => {
  return 0.61094 * Math.exp((17.625 * dryBulbC) / (dryBulbC + 243.04));
};

/**
 * Humidity ratio, kg water / kg dry air.
 * dryBulbC and relativeHumidityPercent define the moist-air state.
 */
export const humidityRatioFromRelativeHumidity = (
  dryBulbC,
  relativeHumidityPercent,
  pressureKPa = STANDARD_ATMOSPHERIC_PRESSURE_KPA,
) => {
  const rh = Math.max(0, Math.min(relativeHumidityPercent, 100)) / 100;
  const vaporPressure = rh * saturationVaporPressure(dryBulbC);

  return (0.621945 * vaporPressure) / (pressureKPa - vaporPressure);
};

/**
 * Humidity ratio from dry-bulb and wet-bulb temperatures.
 * Uses the standard psychrometric wet-bulb approximation for HVAC calculations.
 */
export const humidityRatioFromWetBulb = (
  dryBulbC,
  wetBulbC,
  pressureKPa = STANDARD_ATMOSPHERIC_PRESSURE_KPA,
) => {
  if (wetBulbC > dryBulbC) {
    throw new Error("Wet-bulb temperature cannot exceed dry-bulb temperature.");
  }

  const pwsWetBulb = saturationVaporPressure(wetBulbC);
  const gamma = 0.00066 * pressureKPa;
  const vaporPressure = pwsWetBulb - gamma * (dryBulbC - wetBulbC);

  const boundedVaporPressure = Math.max(0, Math.min(vaporPressure, saturationVaporPressure(dryBulbC)));

  return (0.621945 * boundedVaporPressure) / (pressureKPa - boundedVaporPressure);
};

export const relativeHumidityFromHumidityRatio = (
  dryBulbC,
  humidityRatio,
  pressureKPa = STANDARD_ATMOSPHERIC_PRESSURE_KPA,
) => {
  const vaporPressure =
    (humidityRatio * pressureKPa) / (0.621945 + humidityRatio);
  const saturationPressure = saturationVaporPressure(dryBulbC);

  return (vaporPressure / saturationPressure) * 100;
};
