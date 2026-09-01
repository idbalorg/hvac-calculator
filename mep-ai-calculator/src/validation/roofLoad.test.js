import { calculateRoofLoad } from "../engineering/cooling-load/roof";
import { assertClose } from "./assert";

/**
 * Isolated roof-load validation.
 *
 * Example: 30 m² roof, U = 0.40 W/(m²·K), corrected CLTD = 12 K.
 * Expected Q = 0.40 × 30 × 12 = 144 W.
 */
export const testRoofLoad = () => {
  const result = calculateRoofLoad({
    area: 30,
    uValue: 0.4,
    cltd: 12,
  });

  return assertClose(result.total, 144, 1e-9, "Roof cooling load");
};
