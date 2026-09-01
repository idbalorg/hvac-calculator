import { calculatePeopleLoad } from "../engineering/cooling-load/people";
import { assertClose } from "./assert";

/**
 * Isolated occupant-load validation.
 *
 * Example: 6 occupants at 75 W sensible + 55 W latent per person.
 * Expected sensible = 450 W, latent = 330 W, total = 780 W.
 */
export const testPeopleLoad = () => {
  const result = calculatePeopleLoad({
    people: 6,
    sensibleHeatPerPerson: 75,
    latentHeatPerPerson: 55,
  });

  assertClose(result.sensible, 450, 1e-9, "Occupant sensible load");
  assertClose(result.latent, 330, 1e-9, "Occupant latent load");
  return assertClose(result.total, 780, 1e-9, "Total occupant load");
};

export const testPeopleLoadWithDiversity = () => {
  const result = calculatePeopleLoad({
    people: 10,
    sensibleHeatPerPerson: 75,
    latentHeatPerPerson: 55,
    diversityFactor: 0.8,
  });

  assertClose(result.sensible, 600, 1e-9, "Diversity-adjusted sensible load");
  assertClose(result.latent, 440, 1e-9, "Diversity-adjusted latent load");
  return assertClose(result.total, 1040, 1e-9, "Diversity-adjusted total load");
};
