import { calculateWallLoad } from "../engineering/cooling-load/walls.js";
import { assertClose } from "./assert.js";

/**
 * Isolated wall-load validation.
 *
 * Example: 20 m² wall, U = 0.50 W/(m²·K), corrected CLTD = 10 K.
 * Expected Q = 0.50 × 20 × 10 = 100 W.
 */
export const testWallLoad = () => {
  const result = calculateWallLoad({
    area: 20,
    uValue: 0.5,
    cltd: 10,
  });

  return assertClose(result.total, 100, 1e-9, "Wall cooling load");
};
