/**
 * Standard HVAC air-property assumptions used by the first air-side layer.
 * Keep these explicit so they can later be replaced by pressure-specific data.
 */
export const STANDARD_AIR_DENSITY_KG_M3 = 1.2;
export const AIR_CP_KJ_KG_K = 1.006;

export const dryAirMassFlowFromVolumeFlow = (
  volumeFlowM3s,
  airDensityKgM3 = STANDARD_AIR_DENSITY_KG_M3,
) => {
  if (volumeFlowM3s < 0) throw new Error("Volume airflow cannot be negative.");
  if (airDensityKgM3 <= 0) throw new Error("Air density must be positive.");
  return volumeFlowM3s * airDensityKgM3;
};
