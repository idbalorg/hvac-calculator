import { buildEngineeringInputsForRoom } from "./engineeringInputs.js";
import { humidityRatioFromWetBulb, relativeHumidityFromHumidityRatio } from "../psychrometrics/humidityRatio.js";

const DEFAULT_VENTILATION_STARTER = Object.freeze({
  outdoorAirPerPersonLps: 8,
  outdoorAirPerAreaLpsM2: 0.3,
  effectiveness: 1,
});

const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * Derive outdoor RH from the selected cooling dry-bulb and mean-coincident wet-bulb.
 * The design-condition dataset provides DB/MCWB, so RH is derived rather than
 * copied from the indoor state or entered as an unrelated psychrometric value.
 */
export const deriveOutdoorRelativeHumidity = (selectedCoolingCondition) => {
  if (!selectedCoolingCondition) throw new Error("Selected cooling condition is required.");
  const { dryBulbC, meanCoincidentWetBulbC } = selectedCoolingCondition;
  const humidityRatio = humidityRatioFromWetBulb(dryBulbC, meanCoincidentWetBulbC);
  return relativeHumidityFromHumidityRatio(dryBulbC, humidityRatio);
};

/**
 * Build the room engineering boundary used by Calculator.jsx.
 * A checked project-level dedicated-ventilation requirement enables the load
 * calculation for every room. Explicit room Rp/Ra values are preserved; when
 * both are still zero, a non-zero generic starter basis is used. The starter
 * values are inputs for calculation, not an ASHRAE 62.1 compliance claim.
 */
export const buildEngineeringInputs = ({
  rooms,
  engineeringByRoom = {},
  designConditions,
  ventilationRequired = false,
}) => Object.fromEntries(rooms.map((room) => {
  const base = clone(engineeringByRoom[room.id] || {});

  if (ventilationRequired) {
    const current = base.ventilation || {};
    const rp = Number(current.outdoorAirPerPersonLps) || 0;
    const ra = Number(current.outdoorAirPerAreaLpsM2) || 0;
    const hasExplicitVentilationRate = rp > 0 || ra > 0;
    const rates = hasExplicitVentilationRate
      ? { outdoorAirPerPersonLps: rp, outdoorAirPerAreaLpsM2: ra }
      : DEFAULT_VENTILATION_STARTER;

    base.ventilation = {
      ...current,
      enabled: true,
      outdoorAirPerPersonLps: rates.outdoorAirPerPersonLps,
      outdoorAirPerAreaLpsM2: rates.outdoorAirPerAreaLpsM2,
      effectiveness: Number(current.effectiveness) > 0 ? Number(current.effectiveness) : DEFAULT_VENTILATION_STARTER.effectiveness,
    };
  }

  return [room.id, buildEngineeringInputsForRoom({ room, designConditions, inputs: base })];
}));

export { DEFAULT_VENTILATION_STARTER };
