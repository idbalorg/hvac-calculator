/**
 * Calculate conductive cooling load through a roof.
 *
 * Q = U × A × CLTD_corrected
 *
 * CLTD is supplied by the caller so the calculation engine remains separate
 * from the selected ASHRAE/reference factor dataset.
 *
 * Units:
 * U: W/(m²·K)
 * A: m²
 * CLTD: K
 * Q: W
 */
export const calculateRoofLoad = ({
  area,
  uValue,
  cltd,
  correctedCltd = cltd,
}) => {
  if (area < 0) throw new Error("Roof area cannot be negative.");
  if (uValue < 0) throw new Error("Roof U-value cannot be negative.");
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
