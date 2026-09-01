/**
 * Occupant cooling load.
 *
 * The caller supplies the sensible and latent heat rates per person from the
 * selected engineering reference/table. This keeps the calculation engine
 * independent from a particular ASHRAE activity dataset.
 *
 * Qs = N × qs × diversity
 * Ql = N × ql × diversity
 */
export const calculatePeopleLoad = ({
  people,
  sensibleHeatPerPerson,
  latentHeatPerPerson,
  diversityFactor = 1,
}) => {
  if (people < 0) throw new Error("Occupant count cannot be negative.");
  if (sensibleHeatPerPerson < 0) {
    throw new Error("Sensible heat per person cannot be negative.");
  }
  if (latentHeatPerPerson < 0) {
    throw new Error("Latent heat per person cannot be negative.");
  }
  if (diversityFactor < 0 || diversityFactor > 1) {
    throw new Error("Occupancy diversity factor must be between 0 and 1.");
  }

  const sensible = people * sensibleHeatPerPerson * diversityFactor;
  const latent = people * latentHeatPerPerson * diversityFactor;

  return {
    sensible,
    latent,
    total: sensible + latent,
    method: "occupant-sensible-latent",
    unit: "W",
    inputs: {
      people,
      sensibleHeatPerPerson,
      latentHeatPerPerson,
      diversityFactor,
    },
  };
};
