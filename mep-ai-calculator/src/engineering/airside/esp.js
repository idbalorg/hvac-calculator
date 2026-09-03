/**
 * Airside external static pressure (ESP) utilities.
 *
 * ESP is the pressure the fan must overcome for the selected air path.
 * Manufacturer-dependent component pressure drops remain explicit inputs.
 * No catalogue values or unverified fitting coefficients are embedded here.
 */

const assertNonNegative = (value, name) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} cannot be negative.`);
  }
};

const assertPositive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be positive.`);
  }
};

export const sumPressureDrops = (pressureDropsPa) => {
  if (!Array.isArray(pressureDropsPa)) {
    throw new Error("Pressure drops must be an array.");
  }
  pressureDropsPa.forEach((value) => assertNonNegative(value, "Pressure drop"));
  return pressureDropsPa.reduce((sum, value) => sum + value, 0);
};

export const calculateComponentPressureDrop = ({
  pressureDropPa = 0,
  quantity = 1,
}) => {
  assertNonNegative(pressureDropPa, "Pressure drop");
  assertPositive(quantity, "Quantity");
  return pressureDropPa * quantity;
};

export const calculateFanESP = ({
  criticalPathDuctPressureLossPa = 0,
  terminalPressureDropPa = 0,
  coilPressureDropPa = 0,
  filterPressureDropPa = 0,
  damperPressureDropPa = 0,
  otherPressureDropsPa = [],
  safetyFactor = 0,
}) => {
  assertNonNegative(criticalPathDuctPressureLossPa, "Critical-path duct pressure loss");
  assertNonNegative(terminalPressureDropPa, "Terminal pressure drop");
  assertNonNegative(coilPressureDropPa, "Coil pressure drop");
  assertNonNegative(filterPressureDropPa, "Filter pressure drop");
  assertNonNegative(damperPressureDropPa, "Damper pressure drop");
  assertNonNegative(safetyFactor, "Safety factor");

  const otherPressureDropPa = sumPressureDrops(otherPressureDropsPa);
  const basePressurePa =
    criticalPathDuctPressureLossPa +
    terminalPressureDropPa +
    coilPressureDropPa +
    filterPressureDropPa +
    damperPressureDropPa +
    otherPressureDropPa;

  return {
    criticalPathDuctPressureLossPa,
    terminalPressureDropPa,
    coilPressureDropPa,
    filterPressureDropPa,
    damperPressureDropPa,
    otherPressureDropPa,
    basePressurePa,
    safetyFactor,
    requiredFanESP_Pa: basePressurePa * (1 + safetyFactor),
  };
};
