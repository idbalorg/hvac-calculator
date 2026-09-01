/**
 * Assemble a room cooling load from individual component results.
 *
 * Each component may expose sensibleW, latentW and/or totalW. The assembly
 * normalizes missing values to zero and preserves a component breakdown.
 *
 * The resulting room load is intentionally a calculation assembly layer,
 * not an equipment-sizing safety factor. Design margins belong to the later
 * equipment-selection stage and must remain visible and configurable.
 */

const COMPONENT_KEYS = [
  "walls",
  "roof",
  "windows",
  "people",
  "lighting",
  "equipment",
  "ventilation",
  "infiltration",
];

const toFiniteNonNegative = (value, label) => {
  if (value === undefined || value === null) return 0;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number.`);
  }
  return value;
};

const normalizeComponent = (component, name) => {
  if (!component) {
    return { sensibleW: 0, latentW: 0, totalW: 0 };
  }

  const sensibleW = toFiniteNonNegative(component.sensibleW, `${name} sensible load`);
  const latentW = toFiniteNonNegative(component.latentW, `${name} latent load`);
  const explicitTotal = component.totalW;
  const totalW = explicitTotal === undefined || explicitTotal === null
    ? sensibleW + latentW
    : toFiniteNonNegative(explicitTotal, `${name} total load`);

  return { sensibleW, latentW, totalW };
};

/**
 * Assemble all room cooling-load components.
 */
export const assembleRoomCoolingLoad = (components = {}) => {
  const breakdown = {};

  for (const key of COMPONENT_KEYS) {
    breakdown[key] = normalizeComponent(components[key], key);
  }

  const sensibleW = Object.values(breakdown).reduce(
    (sum, component) => sum + component.sensibleW,
    0,
  );
  const latentW = Object.values(breakdown).reduce(
    (sum, component) => sum + component.latentW,
    0,
  );
  const totalW = sensibleW + latentW;

  const sensibleHeatRatio = totalW > 0 ? sensibleW / totalW : 0;

  return {
    sensibleW,
    latentW,
    totalW,
    sensibleHeatRatio,
    breakdown,
  };
};

/**
 * Apply an explicitly selected design margin to an assembled room load.
 * This is kept separate from the raw load so the engineering report can
 * show both calculated load and selected design load.
 */
export const applyDesignMargin = (roomLoad, marginPercent = 0) => {
  if (!roomLoad || !Number.isFinite(roomLoad.totalW) || roomLoad.totalW < 0) {
    throw new Error("A valid room load is required.");
  }
  if (!Number.isFinite(marginPercent) || marginPercent < 0) {
    throw new Error("Design margin must be a finite non-negative percentage.");
  }

  const multiplier = 1 + marginPercent / 100;

  return {
    marginPercent,
    sensibleW: roomLoad.sensibleW * multiplier,
    latentW: roomLoad.latentW * multiplier,
    totalW: roomLoad.totalW * multiplier,
  };
};
