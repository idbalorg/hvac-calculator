import {
  calculateOutdoorAirflow,
  calculateVentilationLoad,
} from "../engineering/cooling-load/ventilation";
import { assertClose } from "./assert";

export const testOutdoorAirflowPeopleAndArea = () => {
  const result = calculateOutdoorAirflow({
    people: 6,
    areaM2: 30,
    outdoorAirPerPersonLps: 10,
    outdoorAirPerAreaLpsM2: 0.3,
  });

  assertClose(result.peopleComponentLps, 60, 1e-9, "Outdoor air people component");
  assertClose(result.areaComponentLps, 9, 1e-9, "Outdoor air area component");
  return assertClose(result.requiredOutdoorAirLps, 69, 1e-9, "Required outdoor airflow");
};

export const testOutdoorAirflowWithEffectiveness = () => {
  const result = calculateOutdoorAirflow({
    people: 6,
    areaM2: 30,
    outdoorAirPerPersonLps: 10,
    outdoorAirPerAreaLpsM2: 0.3,
    effectiveness: 0.9,
  });

  return assertClose(result.requiredOutdoorAirLps, 76.66666666666667, 1e-9, "Effective outdoor airflow");
};

export const testVentilationSensibleLoad = () => {
  const result = calculateVentilationLoad({
    outdoorAirLps: 100,
    indoorDryBulbC: 24,
    indoorRelativeHumidityPercent: 50,
    outdoorDryBulbC: 34,
    outdoorRelativeHumidityPercent: 70,
  });

  return assertClose(result.sensibleW, 1207.2, 1e-9, "Ventilation sensible load");
};

export const testVentilationLatentAndTotalLoad = () => {
  const result = calculateVentilationLoad({
    outdoorAirLps: 100,
    indoorDryBulbC: 24,
    indoorRelativeHumidityPercent: 50,
    outdoorDryBulbC: 34,
    outdoorRelativeHumidityPercent: 70,
  });

  assertClose(result.totalW, 5530.0, 20, "Ventilation total load");
  assertClose(result.latentW, result.totalW - result.sensibleW, 1e-9, "Ventilation latent load");
  return result;
};
