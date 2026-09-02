import {
  calculateInfiltrationAirflow,
  calculateInfiltrationLoad,
} from "../engineering/cooling-load/infiltration.js";
import { assertClose } from "./assert.js";

export const testInfiltrationAirflowFromACH = () => {
  const result = calculateInfiltrationAirflow({
    roomVolumeM3: 90,
    airChangesPerHour: 0.5,
  });

  assertClose(result.airflowM3PerHour, 45, 1e-9, "Infiltration airflow m3/h");
  return assertClose(result.airflowLps, 12.5, 1e-9, "Infiltration airflow L/s");
};

export const testInfiltrationZeroACH = () => {
  const result = calculateInfiltrationAirflow({
    roomVolumeM3: 90,
    airChangesPerHour: 0,
  });

  return assertClose(
    result.airflowLps,
    0,
    1e-9,
    "Zero ACH infiltration airflow",
  );
};

export const testInfiltrationSensibleLoad = () => {
  const result = calculateInfiltrationLoad({
    infiltrationAirLps: 100,
    indoorDryBulbC: 24,
    indoorRelativeHumidityPercent: 50,
    outdoorDryBulbC: 34,
    outdoorRelativeHumidityPercent: 70,
  });

  return assertClose(
    result.sensibleW,
    1207.2,
    1e-9,
    "Infiltration sensible load",
  );
};

export const testInfiltrationLatentAndTotalLoad = () => {
  const result = calculateInfiltrationLoad({
    infiltrationAirLps: 100,
    indoorDryBulbC: 24,
    indoorRelativeHumidityPercent: 50,
    outdoorDryBulbC: 34,
    outdoorRelativeHumidityPercent: 70,
  });

  assertClose(
    result.totalW,
    3720.590508858974,
    1e-9,
    "Infiltration total load",
  );
  assertClose(
    result.latentW,
    2513.390508858974,
    1e-9,
    "Infiltration latent load",
  );
  return result;
};
