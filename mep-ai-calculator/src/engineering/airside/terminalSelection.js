import { normalizeAirTerminal } from "./airTerminals.js";

export const selectAirTerminal = ({
  requiredAirflowCfm,
  terminals,
  numberOfTerminals = 1,
  maxTerminalAirflowCfm,
  requiredThrowM,
}) => {
  if (!Number.isFinite(requiredAirflowCfm) || requiredAirflowCfm <= 0) {
    throw new Error("Required airflow must be positive.");
  }
  if (!Number.isInteger(numberOfTerminals) || numberOfTerminals <= 0) {
    throw new Error("Number of terminals must be a positive integer.");
  }
  if (!Array.isArray(terminals) || terminals.length === 0) {
    throw new Error("At least one air terminal is required.");
  }
  if (maxTerminalAirflowCfm !== undefined && maxTerminalAirflowCfm <= 0) {
    throw new Error("Maximum terminal airflow must be positive.");
  }
  if (requiredThrowM !== undefined && requiredThrowM <= 0) {
    throw new Error("Required throw must be positive.");
  }

  const airflowPerTerminalCfm = requiredAirflowCfm / numberOfTerminals;
  const candidates = terminals.map(normalizeAirTerminal)
    .filter((terminal) => airflowPerTerminalCfm >= terminal.minAirflowCfm)
    .filter((terminal) => airflowPerTerminalCfm <= terminal.maxAirflowCfm)
    .filter((terminal) => maxTerminalAirflowCfm === undefined || airflowPerTerminalCfm <= maxTerminalAirflowCfm)
    .filter((terminal) => requiredThrowM === undefined || terminal.throwM === null || terminal.throwM >= requiredThrowM)
    .map((terminal) => ({
      ...terminal,
      airflowPerTerminalCfm,
      capacityMarginCfm: terminal.maxAirflowCfm - airflowPerTerminalCfm,
      utilization: airflowPerTerminalCfm / terminal.maxAirflowCfm,
    }))
    .sort((a, b) => a.capacityMarginCfm - b.capacityMarginCfm);

  if (candidates.length === 0) {
    return {
      selected: null,
      suitable: false,
      requiredAirflowCfm,
      numberOfTerminals,
      airflowPerTerminalCfm,
      candidates: [],
    };
  }

  return {
    selected: candidates[0],
    suitable: true,
    requiredAirflowCfm,
    numberOfTerminals,
    airflowPerTerminalCfm,
    candidates,
  };
};

export const calculateTerminalFaceVelocity = ({ airflowCfm, faceAreaM2 }) => {
  if (!Number.isFinite(airflowCfm) || airflowCfm < 0) throw new Error("Airflow cannot be negative.");
  if (!Number.isFinite(faceAreaM2) || faceAreaM2 <= 0) throw new Error("Face area must be positive.");
  const volumeFlowM3s = airflowCfm / 2118.88;
  return volumeFlowM3s / faceAreaM2;
};

export const calculateReturnAirflow = ({ supplyAirflowCfm, transferAirflowCfm = 0 }) => {
  if (supplyAirflowCfm < 0 || transferAirflowCfm < 0) throw new Error("Airflow values cannot be negative.");
  return Math.max(0, supplyAirflowCfm - transferAirflowCfm);
};
