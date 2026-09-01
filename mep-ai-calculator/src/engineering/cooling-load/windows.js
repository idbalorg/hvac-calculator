/**
 * Window cooling-load calculations.
 *
 * Two components are kept separate:
 * 1. Conduction through glazing: Q = U × A × CLTD
 * 2. Solar transmission: Q = A × SHGC × SolarIrradiance × shadingFactor
 *
 * The solar irradiance/SCL input is intentionally supplied by the caller.
 * This prevents the engine from embedding unverified orientation tables.
 *
 * Units:
 * U: W/(m²·K)
 * A: m²
 * CLTD: K
 * SHGC: dimensionless
 * Solar irradiance: W/m²
 * shadingFactor: 0–1
 * Q: W
 */

const validateWindowArea = (area) => {
  if (area < 0) throw new Error("Window area cannot be negative.");
};

export const calculateWindowConduction = ({
  area,
  uValue,
  cltd,
  correctedCltd = cltd,
}) => {
  validateWindowArea(area);
  if (uValue < 0) throw new Error("Window U-value cannot be negative.");
  if (correctedCltd < 0) {
    throw new Error("Corrected window CLTD cannot be negative.");
  }

  const sensible = uValue * area * correctedCltd;

  return {
    sensible,
    latent: 0,
    total: sensible,
    method: "window-conduction-cltd",
    unit: "W",
    inputs: { area, uValue, cltd, correctedCltd },
  };
};

export const calculateWindowSolarGain = ({
  area,
  shgc,
  solarIrradiance,
  shadingFactor = 1,
}) => {
  validateWindowArea(area);
  if (shgc < 0 || shgc > 1) {
    throw new Error("Window SHGC must be between 0 and 1.");
  }
  if (solarIrradiance < 0) {
    throw new Error("Solar irradiance cannot be negative.");
  }
  if (shadingFactor < 0 || shadingFactor > 1) {
    throw new Error("Shading factor must be between 0 and 1.");
  }

  const sensible = area * shgc * solarIrradiance * shadingFactor;

  return {
    sensible,
    latent: 0,
    total: sensible,
    method: "window-solar-shgc",
    unit: "W",
    inputs: { area, shgc, solarIrradiance, shadingFactor },
  };
};

export const calculateWindowLoad = ({
  area,
  uValue,
  cltd,
  correctedCltd = cltd,
  shgc,
  solarIrradiance,
  shadingFactor = 1,
}) => {
  const conduction = calculateWindowConduction({
    area,
    uValue,
    cltd,
    correctedCltd,
  });

  const solar = calculateWindowSolarGain({
    area,
    shgc,
    solarIrradiance,
    shadingFactor,
  });

  return {
    sensible: conduction.sensible + solar.sensible,
    latent: 0,
    total: conduction.total + solar.total,
    components: { conduction, solar },
    method: "window-conduction-plus-solar",
    unit: "W",
  };
};
