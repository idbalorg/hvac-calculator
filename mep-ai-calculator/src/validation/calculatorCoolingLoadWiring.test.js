import { calculateProjectCoolingLoads } from "../engineering/cooling-load/roomLoadEngine.js";
import { buildProjectDesignConditions } from "../engineering/project/designConditions.js";
import { buildEngineeringInputs, deriveOutdoorRelativeHumidity } from "../engineering/project/calculatorEngineeringInputs.js";
import { createEngineeringInputs } from "../engineering/project/engineeringInputs.js";

const room = {
  id: "CALC-WIRING-1",
  name: "Ventilation Test Office",
  length: 6,
  width: 5,
  height: 3,
  people: 6,
  windowAreaM2: 4,
};

const buildDesignConditions = () => {
  const base = buildProjectDesignConditions({
    outdoorConditionId: "LAGOS_IKEJA_ASHRAE_2021",
    coolingPercentile: "percentile04",
    indoorDryBulbC: 24,
    indoorRelativeHumidityPercent: 50,
    outdoorRelativeHumidityPercent: null,
  });
  return buildProjectDesignConditions({
    outdoorConditionId: "LAGOS_IKEJA_ASHRAE_2021",
    coolingPercentile: "percentile04",
    indoorDryBulbC: 24,
    indoorRelativeHumidityPercent: 50,
    outdoorRelativeHumidityPercent: deriveOutdoorRelativeHumidity(base.selectedCoolingCondition),
  });
};

const calculate = ({ ventilationRequired, infiltrationEnabled }) => {
  const designConditions = buildDesignConditions();
  const inputs = createEngineeringInputs({
    ventilation: { enabled: false, outdoorAirPerPersonLps: 0, outdoorAirPerAreaLpsM2: 0 },
    infiltration: { enabled: infiltrationEnabled, method: "ACH", airChangesPerHour: 0.5, airflowLps: 0 },
  });
  const engineering = buildEngineeringInputs({
    rooms: [room],
    engineeringByRoom: { [room.id]: inputs },
    designConditions,
    ventilationRequired,
  });
  return { designConditions, engineering, loads: calculateProjectCoolingLoads({ rooms: [room], engineeringByRoom: engineering, designMarginPercent: 10 }) };
};

export const runCalculatorCoolingLoadWiringTests = () => {
  const baseline = calculate({ ventilationRequired: false, infiltrationEnabled: false });
  const active = calculate({ ventilationRequired: true, infiltrationEnabled: true });
  const activeRoom = active.loads.roomResults[0];
  const baselineRoom = baseline.loads.roomResults[0];
  const derivedRh = active.designConditions.outdoor.relativeHumidityPercent;
  const derivedRhIsOutdoor = Math.abs(derivedRh - active.designConditions.indoor.relativeHumidityPercent) > 0.01;

  return [
    {
      id: "CALCLOAD-001",
      name: "Dedicated ventilation checkbox reaches the cooling-load engine",
      passed: active.engineering[room.id].ventilation?.outdoorAirPerPersonLps === 8 && active.engineering[room.id].ventilation?.outdoorAirPerAreaLpsM2 === 0.3 && active.engineering[room.id].ventilation?.outdoorAirPerPersonLps > 0,
    },
    {
      id: "CALCLOAD-002",
      name: "Outdoor RH is derived from selected DB/MCWB instead of indoor RH",
      passed: Number.isFinite(derivedRh) && derivedRh >= 0 && derivedRh <= 100 && derivedRhIsOutdoor,
    },
    {
      id: "CALCLOAD-003",
      name: "Non-zero ventilation and infiltration increase room design load",
      passed: activeRoom.designLoad.totalW > baselineRoom.designLoad.totalW,
    },
    {
      id: "CALCLOAD-004",
      name: "Non-zero ventilation and infiltration increase project design load",
      passed: active.loads.totalDesignLoadKw > baseline.loads.totalDesignLoadKw,
    },
    {
      id: "CALCLOAD-005",
      name: "Infiltration remains independently enabled and contributes to the room result",
      passed: activeRoom.components.infiltration.total !== 0 && activeRoom.inputsProvided.infiltration === true,
    },
  ];
};
