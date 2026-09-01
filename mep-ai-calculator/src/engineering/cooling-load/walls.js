/**
 * Calculate conductive cooling load through an opaque wall.
 *
 * This module intentionally accepts CLTD as an input rather than embedding
 * ASHRAE CLTD tables. The factor source and correction procedure will be
 * added once the project's CLTD/CLF reference dataset is formally selected.
 *
 * Q = U × A × CLTD_corrected
 *
 * Units:
 * U: W/(m²·K)
 * A: m²
 * CLTD: K (or °C difference)
 * Q: W
 */
export const calculateWallLoad = ({
  area,
  uValue,
  cltd,
  correctedCltd = cltd,
}) => {
  if (area < 0) throw new Error("Wall area cannot be negative.");
  if (uValue < 0) throw new Error("Wall U-value cannot be negative.");
  if (correctedCltd < 0) {
    throw new Error("Corrected CLTD cannot be negative for a cooling load.");
  }

  const coolingLoad = uValue * area * correctedCltd;

  return {
    sensible: coolingLoad,
    latent: 0,
    total: coolingLoad,
    inputs: {
      area,
      uValue,
      cltd,
      correctedCltd,
    },
    method: "CLTD",
    unit: "W",
  };
};
