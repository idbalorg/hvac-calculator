import {
  sumAirflows,
  networkNodeAirflow,
  dynamicPressure,
  fittingPressureLoss,
  ductSegmentPressureLoss,
  calculateDuctPathLoss,
  calculateNetwork,
  criticalPathPressureLoss,
} from "../engineering/airside/ductNetwork.js";
import { assertClose } from "./assert.js";

export const runDuctNetworkTests = () => {
  const tests = [];
  const run = (id, name, fn) => {
    try {
      fn();
      tests.push({ id, name, passed: true });
    } catch (error) {
      tests.push({ id, name, passed: false, error: error.message });
    }
  };

  run("UNIT-NET-001", "Airflow conservation", () => {
    assertClose(sumAirflows([0.20, 0.30, 0.45]), 0.95, 1e-12, "network airflow");
    assertClose(networkNodeAirflow([0.15, 0.25]), 0.40, 1e-12, "node airflow");
  });

  run("UNIT-NET-002", "Dynamic pressure", () => {
    assertClose(dynamicPressure(1.2, 5), 15, 1e-12, "dynamic pressure");
  });

  run("UNIT-NET-003", "Fitting pressure loss from K-value", () => {
    assertClose(
      fittingPressureLoss({ airDensityKgM3: 1.2, velocityMps: 5, lossCoefficientK: 0.5 }),
      7.5,
      1e-12,
      "fitting loss",
    );
  });

  run("UNIT-NET-004", "Straight duct plus fitting loss", () => {
    const result = ductSegmentPressureLoss({
      volumeFlowM3s: 1,
      areaM2: 0.2,
      lengthM: 20,
      frictionRatePaPerM: 0.7,
      airDensityKgM3: 1.2,
      lossCoefficientK: 0.5,
    });
    assertClose(result.velocityMps, 5, 1e-12, "segment velocity");
    assertClose(result.straightLossPa, 14, 1e-12, "straight loss");
    assertClose(result.fittingLossPa, 7.5, 1e-12, "fitting loss");
    assertClose(result.totalPressureLossPa, 21.5, 1e-12, "total segment loss");
  });

  run("UNIT-NET-005", "Path pressure loss", () => {
    const result = calculateDuctPathLoss([
      { volumeFlowM3s: 0.5, areaM2: 0.1, lengthM: 10, frictionRatePaPerM: 0.8 },
      { volumeFlowM3s: 0.5, areaM2: 0.08, lengthM: 5, frictionRatePaPerM: 1.0, lossCoefficientK: 0.25 },
    ]);
    assertClose(result.totalPressureLossPa, 18.859375, 1e-12, "path loss");
  });

  run("UNIT-NET-006", "Branch airflow and main airflow", () => {
    const result = calculateNetwork({
      branches: [
        { id: "R1", terminalAirflowM3s: 0.30, segments: [
          { volumeFlowM3s: 0.30, areaM2: 0.06, lengthM: 8, frictionRatePaPerM: 0.8 },
        ] },
        { id: "R2", terminalAirflowM3s: 0.25, segments: [
          { volumeFlowM3s: 0.25, areaM2: 0.05, lengthM: 10, frictionRatePaPerM: 0.7 },
        ] },
      ],
      mainSegments: [
        { areaM2: 0.1375, lengthM: 12, frictionRatePaPerM: 0.9 },
      ],
    });
    assertClose(result.totalSupplyAirflowM3s, 0.55, 1e-12, "total supply airflow");
    assertClose(result.mainResults[0].volumeFlowM3s, 0.55, 1e-12, "main airflow");
    assertClose(result.mainPressureLossPa, 10.8, 1e-12, "main pressure loss");
  });

  run("UNIT-NET-007", "Critical path pressure loss", () => {
    const result = calculateNetwork({
      branches: [
        { id: "SHORT", terminalAirflowM3s: 0.3, segments: [
          { volumeFlowM3s: 0.3, areaM2: 0.06, lengthM: 5, frictionRatePaPerM: 0.8 },
        ] },
        { id: "LONG", terminalAirflowM3s: 0.2, segments: [
          { volumeFlowM3s: 0.2, areaM2: 0.05, lengthM: 10, frictionRatePaPerM: 0.9 },
          { volumeFlowM3s: 0.2, areaM2: 0.04, lengthM: 5, frictionRatePaPerM: 1.0 },
        ] },
      ],
      mainSegments: [
        { areaM2: 0.125, lengthM: 10, frictionRatePaPerM: 0.7 },
      ],
    });
    assertClose(criticalPathPressureLoss(result), 21, 1e-12, "critical path loss");
  });

  return tests;
};
