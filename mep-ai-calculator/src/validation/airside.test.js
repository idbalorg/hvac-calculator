import { assertClose, assertEqual } from "./assert.js";
import {
  calculateSupplyAirflow,
  calculateSupplyAirState,
} from "../engineering/airside/supplyAir.js";
import { calculateMixedAir } from "../engineering/airside/mixedAir.js";
import { calculateCoilLoad } from "../engineering/airside/coilLoad.js";
import { humidityRatioFromRelativeHumidity } from "../engineering/psychrometrics/humidityRatio.js";

export const testSupplyAirflow = () => {
  const result = calculateSupplyAirflow({
    sensibleLoadW: 5000,
    roomDryBulbC: 24,
    supplyDryBulbC: 14,
  });
  assertClose(result.volumeFlowM3s, 0.41484, 0.0001, "Supply airflow m3/s");
  assertClose(result.cfm, 878.8, 0.5, "Supply airflow CFM");
};

export const testSupplyAirState = () => {
  const roomW = humidityRatioFromRelativeHumidity(24, 50);
  const result = calculateSupplyAirState({
    sensibleLoadW: 5000,
    latentLoadW: 1500,
    roomDryBulbC: 24,
    roomRelativeHumidityPercent: 50,
    supplyDryBulbC: 14,
  });
  assertClose(result.dryBulbC, 14, 0.0001, "Supply dry bulb");
  assertClose(
    result.humidityRatioKgKg,
    roomW - 1500 / (result.massFlowKgDryAirS * 2501 * 1000),
    1e-9,
    "Supply humidity ratio",
  );
};

export const testMixedAir = () => {
  const result = calculateMixedAir({
    returnAir: { dryBulbC: 24, relativeHumidityPercent: 50 },
    outdoorAir: { dryBulbC: 34, relativeHumidityPercent: 70 },
    outdoorAirFraction: 0.2,
  });
  assertClose(result.dryBulbC, 26, 0.0001, "Mixed-air dry bulb");
  assertClose(
    result.humidityRatioKgKg,
    0.8 * humidityRatioFromRelativeHumidity(24, 50) +
      0.2 * humidityRatioFromRelativeHumidity(34, 70),
    1e-9,
    "Mixed-air humidity ratio",
  );
};

export const testCoilLoad = () => {
  const enteringW = humidityRatioFromRelativeHumidity(26, 60);
  const leavingW = humidityRatioFromRelativeHumidity(14, 90);
  const result = calculateCoilLoad({
    enteringAir: { dryBulbC: 26, humidityRatioKgKg: enteringW },
    leavingAir: { dryBulbC: 14, humidityRatioKgKg: leavingW },
    volumeFlowM3s: 0.5,
  });
  assertEqual(
    result.totalLoadW > result.sensibleLoadW,
    true,
    "Coil total exceeds sensible",
  );
  assertEqual(result.latentLoadW > 0, true, "Coil latent load positive");
  assertClose(
    result.totalLoadW,
    result.sensibleLoadW + result.latentLoadW,
    1e-6,
    "Coil load balance",
  );
};
