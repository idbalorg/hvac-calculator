import {
  ductArea,
  ductVelocity,
  roundDuctDiameterByVelocity,
  rectangularDuctByVelocity,
  hydraulicDiameterRectangular,
  equivalentDiameterRectangular,
  ductPressureDropFromFriction,
  ductSegmentDesign,
} from "../engineering/airside/ductSizing.js";
import { assertClose, assertEqual } from "./assert.js";

export const runDuctSizingTests = () => {
  const results = [];

  const run = (id, name, fn) => {
    try {
      fn();
      results.push({ id, name, passed: true });
    } catch (error) {
      results.push({ id, name, passed: false, error: error.message });
    }
  };

  run("UNIT-DUCT-001", "Rectangular duct area and velocity", () => {
    const area = ductArea(0.6, 0.35);
    assertClose(area, 0.21, 1e-12, "duct area");
    assertClose(ductVelocity(1.05, area), 5, 1e-12, "duct velocity");
  });

  run("UNIT-DUCT-002", "Round duct diameter from target velocity", () => {
    const result = roundDuctDiameterByVelocity(0.5, 5);
    assertClose(result.areaM2, 0.1, 1e-12, "round duct area");
    assertClose(result.diameterM, Math.sqrt(0.4 / Math.PI), 1e-12, "round duct diameter");
  });

  run("UNIT-DUCT-003", "Rectangular duct height from target velocity", () => {
    const result = rectangularDuctByVelocity(0.42, 0.6, 3.5);
    assertClose(result.areaM2, 0.12, 1e-12, "rectangular duct area");
    assertClose(result.heightM, 0.2, 1e-12, "rectangular duct height");
    assertClose(result.aspectRatio, 3, 1e-12, "aspect ratio");
  });

  run("UNIT-DUCT-004", "Rectangular hydraulic diameter", () => {
    assertClose(
      hydraulicDiameterRectangular(0.6, 0.35),
      (4 * 0.6 * 0.35) / (2 * (0.6 + 0.35)),
      1e-12,
      "hydraulic diameter",
    );
  });

  run("UNIT-DUCT-005", "Rectangular equivalent diameter", () => {
    const expected = 1.30 * Math.pow(0.6 * 0.35, 0.625) / Math.pow(0.6 + 0.35, 0.25);
    assertClose(equivalentDiameterRectangular(0.6, 0.35), expected, 1e-12, "equivalent diameter");
  });

  run("UNIT-DUCT-006", "Straight duct friction pressure drop", () => {
    assertClose(ductPressureDropFromFriction(0.8, 25), 20, 1e-12, "pressure drop");
  });

  run("UNIT-DUCT-007", "Complete rectangular duct segment design", () => {
    const result = ductSegmentDesign({
      volumeFlowM3s: 1.05,
      widthM: 0.6,
      heightM: 0.35,
      lengthM: 18,
      frictionRatePaPerM: 0.8,
    });

    assertClose(result.areaM2, 0.21, 1e-12, "segment area");
    assertClose(result.velocityMps, 5, 1e-12, "segment velocity");
    assertClose(result.pressureDropPa, 14.4, 1e-12, "segment pressure drop");
    assertEqual(result.widthM, 0.6, "segment width");
    assertEqual(result.heightM, 0.35, "segment height");
  });

  return results;
};
