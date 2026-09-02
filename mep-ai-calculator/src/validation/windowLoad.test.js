import {
  calculateWindowConduction,
  calculateWindowSolarGain,
  calculateWindowLoad,
} from "../engineering/cooling-load/windows.js";
import { assertClose } from "./assert.js";

export const testWindowConduction = () => {
  const result = calculateWindowConduction({
    area: 6,
    uValue: 2.5,
    cltd: 8,
  });

  return assertClose(result.total, 120, 1e-9, "Window conduction load");
};

export const testWindowSolarGain = () => {
  const result = calculateWindowSolarGain({
    area: 6,
    shgc: 0.5,
    solarIrradiance: 600,
    shadingFactor: 1,
  });

  return assertClose(result.total, 1800, 1e-9, "Window solar gain");
};

export const testWindowCombinedLoad = () => {
  const result = calculateWindowLoad({
    area: 6,
    uValue: 2.5,
    cltd: 8,
    shgc: 0.5,
    solarIrradiance: 600,
  });

  return assertClose(result.total, 1920, 1e-9, "Combined window load");
};
