/**
 * Stage 15: full air-distribution integration.
 *
 * Connects selected equipment airflow/ESP to a user-defined terminal, branch
 * and main duct network. Design criteria, fitting K-values and component
 * pressure drops remain explicit inputs. No manufacturer or code limits are embedded.
 */
import { buildDuctDistribution } from "./ductDistribution.js";
import { calculateNetwork, criticalPathPressureLoss } from "./ductNetwork.js";
import { calculateFanESP } from "./esp.js";
import { selectAirTerminal } from "./terminalSelection.js";

const M3S_TO_CFM = 2118.88;
const CFM_TO_M3S = 1 / M3S_TO_CFM;

const assertPositive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be greater than zero`);
};
const assertNonNegative = (value, name) => {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} cannot be negative`);
};

export const calculateDistributionAirflow = ({ requiredAirflowM3s, terminalCount = 1 }) => {
  assertPositive(requiredAirflowM3s, "Required airflow");
  if (!Number.isInteger(terminalCount) || terminalCount <= 0) throw new Error("Terminal count must be a positive integer.");
  const requiredAirflowCfm = requiredAirflowM3s * M3S_TO_CFM;
  return { requiredAirflowM3s, requiredAirflowCfm, airflowPerTerminalCfm: requiredAirflowCfm / terminalCount };
};

export const validateEquipmentAirflow = ({ selectedEquipmentAirflowCfm, requiredAirflowCfm, toleranceFraction = 0 }) => {
  assertPositive(selectedEquipmentAirflowCfm, "Selected equipment airflow");
  assertPositive(requiredAirflowCfm, "Required airflow");
  assertNonNegative(toleranceFraction, "Airflow tolerance");
  const deviationFraction = (selectedEquipmentAirflowCfm - requiredAirflowCfm) / requiredAirflowCfm;
  return {
    selectedEquipmentAirflowCfm,
    requiredAirflowCfm,
    deviationFraction,
    absoluteDeviationFraction: Math.abs(deviationFraction),
    acceptable: Math.abs(deviationFraction) <= toleranceFraction,
  };
};

export const integrateAirDistribution = ({
  selectedEquipmentAirflowCfm,
  availableFanEspPa = null,
  requiredAirflowM3s,
  branches,
  mainSections = [],
  terminalSelection = null,
  terminalPressureDropPa = 0,
  coilPressureDropPa = 0,
  filterPressureDropPa = 0,
  damperPressureDropPa = 0,
  otherPressureDropsPa = [],
  espSafetyFactor = 0,
  airflowToleranceFraction = 0,
}) => {
  assertPositive(selectedEquipmentAirflowCfm, "Selected equipment airflow");
  if (availableFanEspPa !== null) assertNonNegative(availableFanEspPa, "Available fan ESP");
  if (!Array.isArray(branches) || branches.length === 0) throw new Error("At least one duct branch is required.");

  const airflow = calculateDistributionAirflow({ requiredAirflowM3s, terminalCount: branches.length });
  const airflowCheck = validateEquipmentAirflow({ selectedEquipmentAirflowCfm, requiredAirflowCfm: airflow.requiredAirflowCfm, toleranceFraction: airflowToleranceFraction });
  const distribution = buildDuctDistribution({ branches, mainSections });

  // Preserve explicit network-loss inputs supplied by the engineer. The
  // distribution sizing result supplies the conserved airflow and dimensions.
  const network = calculateNetwork({
    branches: branches.map((branch, index) => ({
      id: distribution.branches[index].id,
      terminalAirflowM3s: distribution.branches[index].airflowM3s,
      segments: branch.segments ?? [],
    })),
    mainSegments: mainSections,
  });
  const criticalDuctLossPa = criticalPathPressureLoss(network);
  const esp = calculateFanESP({
    criticalPathDuctPressureLossPa: criticalDuctLossPa,
    terminalPressureDropPa,
    coilPressureDropPa,
    filterPressureDropPa,
    damperPressureDropPa,
    otherPressureDropsPa,
    safetyFactor: espSafetyFactor,
  });

  const espCheck = availableFanEspPa === null
    ? { availableFanEspPa: null, requiredFanESP_Pa: esp.requiredFanESP_Pa, acceptable: null, marginPa: null }
    : { availableFanEspPa, requiredFanESP_Pa: esp.requiredFanESP_Pa, acceptable: availableFanEspPa >= esp.requiredFanESP_Pa, marginPa: availableFanEspPa - esp.requiredFanESP_Pa };

  return {
    airflow,
    airflowCheck,
    distribution,
    network,
    criticalDuctLossPa,
    esp,
    espCheck,
    terminalSelection,
    engineeringStatus: airflowCheck.acceptable && (espCheck.acceptable === null || espCheck.acceptable)
      ? "AIR_DISTRIBUTION_ACCEPTABLE"
      : "AIR_DISTRIBUTION_REVIEW_REQUIRED",
    verificationRequired: true,
  };
};

export const selectDistributionTerminal = ({ requiredAirflowCfm, terminals, numberOfTerminals = 1, maxTerminalAirflowCfm, requiredThrowM }) =>
  selectAirTerminal({ requiredAirflowCfm, terminals, numberOfTerminals, maxTerminalAirflowCfm, requiredThrowM });

export const airflowCfmToM3s = (airflowCfm) => {
  assertNonNegative(airflowCfm, "Airflow");
  return airflowCfm * CFM_TO_M3S;
};
