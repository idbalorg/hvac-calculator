/**
 * Moist-air specific enthalpy, kJ/kg dry air.
 * h = 1.006*Tdb + W*(2501 + 1.86*Tdb)
 */
export const moistAirEnthalpy = (dryBulbC, humidityRatio) => {
  return 1.006 * dryBulbC + humidityRatio * (2501 + 1.86 * dryBulbC);
};
