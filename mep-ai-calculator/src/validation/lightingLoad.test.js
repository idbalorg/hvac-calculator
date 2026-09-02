import {
  calculateLightingLoadByPowerDensity,
  calculateLightingLoadByFixtures,
} from "../engineering/cooling-load/lighting.js";
import { assertClose } from "./assert.js";

export const testLightingPowerDensity = () => {
  const result = calculateLightingLoadByPowerDensity({
    floorArea: 30,
    powerDensity: 10,
  });

  return assertClose(result.total, 300, 1e-9, "Lighting power-density load");
};

export const testLightingFixtureSchedule = () => {
  const result = calculateLightingLoadByFixtures({
    fixtures: [
      { type: "LED panel", quantity: 10, watts: 20 },
      { type: "downlight", quantity: 5, watts: 12 },
    ],
  });

  return assertClose(result.total, 260, 1e-9, "Lighting fixture-schedule load");
};

export const testLightingUseFactor = () => {
  const result = calculateLightingLoadByPowerDensity({
    floorArea: 30,
    powerDensity: 10,
    useFactor: 0.8,
  });

  return assertClose(result.total, 240, 1e-9, "Lighting use-factor load");
};
