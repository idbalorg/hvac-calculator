/**
 * Internal equipment cooling load.
 *
 * Most plug/electronic equipment is treated as sensible heat to the space.
 * Equipment that contributes moisture can provide an optional latent heat rate.
 *
 * Qs = Σ(quantity × sensibleWatts × useFactor)
 * Ql = Σ(quantity × latentWatts × useFactor)
 */
export const calculateEquipmentLoad = ({
  equipment,
  defaultUseFactor = 1,
}) => {
  if (!Array.isArray(equipment)) {
    throw new Error("Equipment must be an array.");
  }
  if (defaultUseFactor < 0 || defaultUseFactor > 1) {
    throw new Error("Equipment use factor must be between 0 and 1.");
  }

  const components = equipment.map((item) => {
    const quantity = item.quantity ?? 1;
    const sensibleWatts = item.sensibleWatts ?? item.watts ?? 0;
    const latentWatts = item.latentWatts ?? 0;
    const useFactor = item.useFactor ?? defaultUseFactor;

    if (quantity < 0) throw new Error("Equipment quantity cannot be negative.");
    if (sensibleWatts < 0) throw new Error("Equipment sensible heat cannot be negative.");
    if (latentWatts < 0) throw new Error("Equipment latent heat cannot be negative.");
    if (useFactor < 0 || useFactor > 1) {
      throw new Error("Equipment use factor must be between 0 and 1.");
    }

    return {
      type: item.type ?? "equipment",
      quantity,
      sensible: quantity * sensibleWatts * useFactor,
      latent: quantity * latentWatts * useFactor,
      useFactor,
    };
  });

  const sensible = components.reduce((sum, item) => sum + item.sensible, 0);
  const latent = components.reduce((sum, item) => sum + item.latent, 0);

  return {
    sensible,
    latent,
    total: sensible + latent,
    components,
    method: "equipment-schedule",
    unit: "W",
    inputs: { equipment, defaultUseFactor },
  };
};
