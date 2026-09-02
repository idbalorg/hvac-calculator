/**
 * Duct-network utilities.
 *
 * A network is represented as terminal branches feeding a common main.
 * Airflow is conserved at each junction. Pressure losses are calculated from
 * explicit user-supplied straight-duct friction rates and fitting K-values.
 * No unverified fitting coefficients or design velocity limits are embedded.
 */

const assertNonNegative = (value, name) => {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} cannot be negative.`);
};

const assertPositive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be positive.`);
};

export const sumAirflows = (airflowsM3s) => {
  if (!Array.isArray(airflowsM3s)) throw new Error("Airflows must be an array.");
  airflowsM3s.forEach((flow) => assertNonNegative(flow, "Airflow"));
  return airflowsM3s.reduce((sum, flow) => sum + flow, 0);
};

export const networkNodeAirflow = (downstreamFlowsM3s) =>
  sumAirflows(downstreamFlowsM3s);

export const dynamicPressure = (airDensityKgM3, velocityMps) => {
  assertPositive(airDensityKgM3, "Air density");
  assertNonNegative(velocityMps, "Velocity");
  return 0.5 * airDensityKgM3 * velocityMps ** 2;
};

export const fittingPressureLoss = ({
  airDensityKgM3,
  velocityMps,
  lossCoefficientK = 0,
}) => {
  assertNonNegative(lossCoefficientK, "Loss coefficient");
  return lossCoefficientK * dynamicPressure(airDensityKgM3, velocityMps);
};

export const ductSegmentPressureLoss = ({
  volumeFlowM3s,
  areaM2,
  lengthM,
  frictionRatePaPerM,
  airDensityKgM3 = 1.2,
  lossCoefficientK = 0,
}) => {
  assertNonNegative(volumeFlowM3s, "Airflow");
  assertPositive(areaM2, "Duct area");
  assertNonNegative(lengthM, "Duct length");
  assertNonNegative(frictionRatePaPerM, "Friction rate");
  assertNonNegative(lossCoefficientK, "Loss coefficient");

  const velocityMps = volumeFlowM3s / areaM2;
  const straightLossPa = frictionRatePaPerM * lengthM;
  const fittingLossPa = fittingPressureLoss({
    airDensityKgM3,
    velocityMps,
    lossCoefficientK,
  });

  return {
    volumeFlowM3s,
    areaM2,
    velocityMps,
    lengthM,
    frictionRatePaPerM,
    lossCoefficientK,
    straightLossPa,
    fittingLossPa,
    totalPressureLossPa: straightLossPa + fittingLossPa,
  };
};

export const calculateDuctPathLoss = (segments) => {
  if (!Array.isArray(segments)) throw new Error("Duct path segments must be an array.");

  const segmentResults = segments.map((segment) => ductSegmentPressureLoss(segment));
  const totalPressureLossPa = segmentResults.reduce(
    (sum, segment) => sum + segment.totalPressureLossPa,
    0,
  );

  return { segmentResults, totalPressureLossPa };
};

export const calculateNetwork = ({ branches, mainSegments = [] }) => {
  if (!Array.isArray(branches) || branches.length === 0) {
    throw new Error("At least one duct branch is required.");
  }

  const branchResults = branches.map((branch) => ({
    id: branch.id,
    terminalAirflowM3s: branch.terminalAirflowM3s,
    path: calculateDuctPathLoss(branch.segments),
  }));

  const totalSupplyAirflowM3s = sumAirflows(
    branchResults.map((branch) => branch.terminalAirflowM3s),
  );

  const mainResults = mainSegments.map((segment) => ({
    ...segment,
    volumeFlowM3s: segment.volumeFlowM3s ?? totalSupplyAirflowM3s,
  })).map((segment) => ductSegmentPressureLoss(segment));

  const mainPressureLossPa = mainResults.reduce(
    (sum, segment) => sum + segment.totalPressureLossPa,
    0,
  );

  return {
    totalSupplyAirflowM3s,
    branchResults,
    mainResults,
    mainPressureLossPa,
    branchPressureLossesPa: branchResults.map((branch) => ({
      id: branch.id,
      pressureLossPa: branch.path.totalPressureLossPa,
    })),
  };
};

export const criticalPathPressureLoss = (networkResult) => {
  if (!networkResult || !Array.isArray(networkResult.branchResults)) {
    throw new Error("A calculated duct network is required.");
  }

  if (networkResult.branchResults.length === 0) return 0;

  const maxBranchLoss = Math.max(
    ...networkResult.branchResults.map((branch) => branch.path.totalPressureLossPa),
  );

  return networkResult.mainPressureLossPa + maxBranchLoss;
};
