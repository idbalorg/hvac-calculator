/**
 * Lighting cooling load.
 *
 * Supports two input methods:
 * - powerDensity: W/m² × floor area
 * - fixtureSchedule: quantity × fixture wattage × ballast factor
 *
 * Lighting heat is treated as sensible heat to the space.
 */

export const calculateLightingLoadByPowerDensity = ({
  floorArea,
  powerDensity,
  useFactor = 1,
  ballastFactor = 1,
}) => {
  if (floorArea < 0) throw new Error("Floor area cannot be negative.");
  if (powerDensity < 0) throw new Error("Lighting power density cannot be negative.");
  if (useFactor < 0 || useFactor > 1) throw new Error("Lighting use factor must be between 0 and 1.");
  if (ballastFactor < 0) throw new Error("Ballast factor cannot be negative.");

  const sensible = floorArea * powerDensity * useFactor * ballastFactor;

  return {
    sensible,
    latent: 0,
    total: sensible,
    method: "lighting-power-density",
    unit: "W",
    inputs: { floorArea, powerDensity, useFactor, ballastFactor },
  };
};

export const calculateLightingLoadByFixtures = ({
  fixtures,
  useFactor = 1,
}) => {
  if (!Array.isArray(fixtures)) throw new Error("Fixtures must be an array.");
  if (useFactor < 0 || useFactor > 1) throw new Error("Lighting use factor must be between 0 and 1.");

  const installedLoad = fixtures.reduce((sum, fixture) => {
    if (fixture.quantity < 0) throw new Error("Fixture quantity cannot be negative.");
    if (fixture.watts < 0) throw new Error("Fixture wattage cannot be negative.");
    if (fixture.ballastFactor < 0) throw new Error("Fixture ballast factor cannot be negative.");

    return sum + fixture.quantity * fixture.watts * (fixture.ballastFactor ?? 1);
  }, 0);

  const sensible = installedLoad * useFactor;

  return {
    sensible,
    latent: 0,
    total: sensible,
    method: "lighting-fixture-schedule",
    unit: "W",
    inputs: { fixtures, useFactor },
  };
};
