/**
 * Resolves whether supply-air ductwork is applicable to the selected HVAC
 * system and terminal/distribution arrangement.
 *
 * System selection is not a duct-design criterion by itself. A system may be
 * either direct-discharge or ducted depending on the selected terminal.
 */

const SYSTEMS = ["SPLIT_DX", "DUCTED_SPLIT", "VRF", "CHILLED_WATER"];
const DISTRIBUTION_TYPES = ["DIRECT_DISCHARGE", "DUCTED"];

const DEFAULT_DISTRIBUTION = {
  SPLIT_DX: "DIRECT_DISCHARGE",
  DUCTED_SPLIT: "DUCTED",
  VRF: "DIRECT_DISCHARGE",
  CHILLED_WATER: "DUCTED",
};

export const resolveAirDistributionContext = ({
  systemType,
  distributionType = null,
  terminalType = null,
}) => {
  if (!SYSTEMS.includes(systemType)) throw new Error(`Unsupported systemType: ${systemType}`);

  const resolvedDistributionType = distributionType || DEFAULT_DISTRIBUTION[systemType];
  if (!DISTRIBUTION_TYPES.includes(resolvedDistributionType)) {
    throw new Error(`Unsupported distributionType: ${resolvedDistributionType}`);
  }

  const ductRequired = resolvedDistributionType === "DUCTED";
  const labels = {
    SPLIT_DX: "Split DX",
    DUCTED_SPLIT: "Ducted Split",
    VRF: "VRF",
    CHILLED_WATER: "Chilled Water",
  };

  return {
    systemType,
    systemLabel: labels[systemType],
    distributionType: resolvedDistributionType,
    ductRequired,
    terminalType,
    airflowSource: ductRequired ? "STAGE_13_AIRSIDE" : null,
    note: ductRequired
      ? "Duct design uses the calculated Stage 13 design airflow. Selected equipment airflow is used separately when manufacturer data is available."
      : "Supply-air duct calculations are not applicable to this direct-discharge arrangement.",
  };
};

export const getDefaultDistributionType = (systemType) => {
  if (!SYSTEMS.includes(systemType)) throw new Error(`Unsupported systemType: ${systemType}`);
  return DEFAULT_DISTRIBUTION[systemType];
};
