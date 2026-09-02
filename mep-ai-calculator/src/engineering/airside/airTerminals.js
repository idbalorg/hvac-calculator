/**
 * Manufacturer-neutral air terminal data helpers.
 *
 * Performance values such as airflow, throw and pressure drop must come from
 * manufacturer data. This module only validates and normalizes supplied data.
 */

const positive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be positive.`);
  }
};

export const validateAirTerminal = (terminal) => {
  if (!terminal || typeof terminal !== "object") {
    throw new Error("Air terminal must be an object.");
  }
  if (!terminal.id) throw new Error("Air terminal id is required.");
  if (!terminal.type) throw new Error("Air terminal type is required.");
  positive(terminal.minAirflowCfm, "Minimum airflow");
  positive(terminal.maxAirflowCfm, "Maximum airflow");
  if (terminal.maxAirflowCfm < terminal.minAirflowCfm) {
    throw new Error("Maximum airflow cannot be below minimum airflow.");
  }
  if (terminal.pressureDropPa !== undefined) positive(terminal.pressureDropPa, "Pressure drop");
  if (terminal.throwM !== undefined) positive(terminal.throwM, "Throw");
  return true;
};

export const normalizeAirTerminal = (terminal) => {
  validateAirTerminal(terminal);
  return {
    ...terminal,
    minAirflowCfm: Number(terminal.minAirflowCfm),
    maxAirflowCfm: Number(terminal.maxAirflowCfm),
    pressureDropPa: terminal.pressureDropPa === undefined ? null : Number(terminal.pressureDropPa),
    throwM: terminal.throwM === undefined ? null : Number(terminal.throwM),
  };
};
