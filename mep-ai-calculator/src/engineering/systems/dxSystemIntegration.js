/**
 * Stage 14: connect room/airside design results to a user-supplied DX
 * equipment catalogue.
 *
 * Manufacturer/model data remains an explicit input. This module does not
 * invent performance data or claim final manufacturer selection approval.
 */
import { selectEquipmentPair } from "../equipment/equipmentSelection.js";
import { sizeDxSystem } from "./dxSizing.js";

const M3S_TO_CFM = 2118.88;

const assertPositive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be greater than zero`);
};

export const calculateDxRequiredCapacity = ({
  roomDesignLoadW,
  coilTotalLoadW = null,
  designMarginPercent = 0,
}) => {
  const basisLoadW = coilTotalLoadW !== null && coilTotalLoadW !== undefined
    ? coilTotalLoadW
    : roomDesignLoadW;
  assertPositive(basisLoadW, "DX design load basis");
  return {
    basis: coilTotalLoadW !== null && coilTotalLoadW !== undefined ? "COIL_TOTAL_LOAD" : "ROOM_DESIGN_LOAD",
    basisLoadW,
    sizing: sizeDxSystem({ roomLoadW: basisLoadW, designMarginPercent }),
  };
};

export const integrateDxSystemSelection = ({
  roomDesignLoadW,
  roomSensibleLoadW = null,
  coilTotalLoadW = null,
  requiredAirflowM3s = null,
  requiredEspPa = null,
  designMarginPercent = 0,
  maxOversizeFraction = 0.15,
  airflowToleranceFraction = 0,
  indoorUnits = [],
  outdoorUnits = [],
}) => {
  assertPositive(roomDesignLoadW, "roomDesignLoadW");
  const capacity = calculateDxRequiredCapacity({ roomDesignLoadW, coilTotalLoadW, designMarginPercent });
  const requiredAirflowCfm = requiredAirflowM3s === null || requiredAirflowM3s === undefined
    ? null
    : requiredAirflowM3s * M3S_TO_CFM;

  const selection = selectEquipmentPair({
    requiredCapacityKw: capacity.sizing.requiredCapacityKW,
    indoorUnits,
    outdoorUnits,
    requiredAirflowCfm,
    requiredEspPa,
    maxOversizeFraction,
    airflowToleranceFraction,
  });

  const selectedCapacityKW = selection.selected?.indoorUnit?.coolingCapacityKw ?? null;
  const coverage = selectedCapacityKW === null
    ? null
    : {
        selectedCapacityKW,
        requiredCapacityKW: capacity.sizing.requiredCapacityKW,
        coverageRatio: selectedCapacityKW / capacity.sizing.requiredCapacityKW,
        excessCapacityKW: selectedCapacityKW - capacity.sizing.requiredCapacityKW,
      };

  const warnings = [...selection.warnings];
  if (coverage && coverage.coverageRatio > 1 + maxOversizeFraction) warnings.push("EXCESSIVE_OVERSIZE");
  if (roomSensibleLoadW !== null && roomSensibleLoadW > roomDesignLoadW) warnings.push("SENSIBLE_LOAD_EXCEEDS_TOTAL_LOAD");

  return {
    capacityBasis: capacity,
    requiredAirflowM3s,
    requiredAirflowCfm,
    requiredEspPa,
    selection,
    coverage,
    warnings: [...new Set(warnings)],
    engineeringStatus: selection.selected ? "PRELIMINARY_SELECTION" : "NO_VALID_SELECTION",
    verificationRequired: true,
  };
};
