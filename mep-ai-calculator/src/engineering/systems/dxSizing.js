/**
 * DX/split-system preliminary sizing.
 *
 * This module deliberately does not select a manufacturer/model or invent
 * efficiency data. It converts a design cooling load into a required nominal
 * capacity and filters a user-supplied equipment catalogue.
 */

const KW_PER_TR = 3.517;
const KW_PER_HP = 0.746;

export const sizeDxSystem = ({
  roomLoadW,
  designMarginPercent = 0,
  minimumMarginPercent = 0,
  maximumMarginPercent = 20,
}) => {
  if (roomLoadW < 0) throw new Error("Room cooling load cannot be negative.");
  if (designMarginPercent < minimumMarginPercent || designMarginPercent > maximumMarginPercent) {
    throw new Error(`Design margin must be between ${minimumMarginPercent}% and ${maximumMarginPercent}%.`);
  }

  const designLoadW = roomLoadW * (1 + designMarginPercent / 100);
  const requiredCapacityKW = designLoadW / 1000;

  return {
    roomLoadW,
    designMarginPercent,
    designLoadW,
    requiredCapacityKW,
    requiredCapacityTR: requiredCapacityKW / KW_PER_TR,
    requiredCapacityHP: requiredCapacityKW / KW_PER_HP,
  };
};

/**
 * Select suitable catalogue units by nominal cooling capacity.
 * oversizeFraction controls the maximum permitted oversizing relative to the
 * calculated design load. Undersizing is rejected unless explicitly allowed.
 */
export const selectDxEquipment = ({
  requiredCapacityKW,
  equipment = [],
  maxOversizeFraction = 0.15,
  allowUndersize = false,
}) => {
  if (requiredCapacityKW <= 0) throw new Error("Required capacity must be positive.");
  if (maxOversizeFraction < 0) throw new Error("Maximum oversize fraction cannot be negative.");

  const acceptable = equipment
    .filter((unit) => unit.coolingCapacityKW > 0)
    .filter((unit) => allowUndersize || unit.coolingCapacityKW >= requiredCapacityKW)
    .filter((unit) => unit.coolingCapacityKW <= requiredCapacityKW * (1 + maxOversizeFraction))
    .map((unit) => ({
      ...unit,
      capacityRatio: unit.coolingCapacityKW / requiredCapacityKW,
      excessCapacityKW: unit.coolingCapacityKW - requiredCapacityKW,
    }))
    .sort((a, b) => a.excessCapacityKW - b.excessCapacityKW);

  return {
    requiredCapacityKW,
    candidates: acceptable,
    selected: acceptable[0] ?? null,
  };
};

export const calculateDxCapacityCheck = ({
  requiredCapacityKW,
  selectedCapacityKW,
}) => {
  if (requiredCapacityKW <= 0 || selectedCapacityKW <= 0) {
    throw new Error("Both required and selected capacities must be positive.");
  }

  const coverageRatio = selectedCapacityKW / requiredCapacityKW;

  return {
    requiredCapacityKW,
    selectedCapacityKW,
    coverageRatio,
    coveragePercent: coverageRatio * 100,
    excessCapacityKW: selectedCapacityKW - requiredCapacityKW,
    meetsLoad: selectedCapacityKW >= requiredCapacityKW,
  };
};
