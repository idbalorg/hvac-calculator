/**
 * Stage 2A duct distribution design.
 *
 * Converts terminal airflows into branch and main duct sizes using an
 * explicitly supplied target velocity. No velocity limits or manufacturer
 * data are embedded in this module.
 */

import {
  roundDuctDiameterByVelocity,
  rectangularDuctByVelocity,
} from "./ductSizing.js";
import { cfmToLps } from "../../utils/conversions.js";

const LPS_TO_M3S = 0.001;

const assertFiniteNonNegative = (value, name) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} cannot be negative.`);
  }
};

const assertPositive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be positive.`);
  }
};

const cfmToM3s = (cfm) => cfmToLps(cfm) * LPS_TO_M3S;

export const sumTerminalAirflows = (terminalAirflowsCfm) => {
  if (!Array.isArray(terminalAirflowsCfm) || terminalAirflowsCfm.length === 0) {
    throw new Error("Terminal airflows are required.");
  }

  return terminalAirflowsCfm.reduce((total, airflow, index) => {
    assertFiniteNonNegative(airflow, `Terminal airflow ${index + 1}`);
    return total + airflow;
  }, 0);
};

export const calculateBranchAirflow = ({ terminalAirflowsCfm }) => {
  const airflowCfm = sumTerminalAirflows(terminalAirflowsCfm);
  return {
    airflowCfm,
    airflowM3s: cfmToM3s(airflowCfm),
    terminalCount: terminalAirflowsCfm.length,
  };
};

export const sizeDuctByVelocity = ({
  volumeFlowM3s,
  targetVelocityMps,
  shape = "rectangular",
  widthM,
}) => {
  assertFiniteNonNegative(volumeFlowM3s, "Volume airflow");
  assertPositive(targetVelocityMps, "Target velocity");

  if (shape === "round") {
    return {
      shape,
      ...roundDuctDiameterByVelocity(volumeFlowM3s, targetVelocityMps),
    };
  }

  if (shape === "rectangular") {
    assertPositive(widthM, "Duct width");
    return {
      shape,
      ...rectangularDuctByVelocity(volumeFlowM3s, widthM, targetVelocityMps),
    };
  }

  throw new Error("Duct shape must be rectangular or round.");
};

export const sizeBranchDuct = ({
  id,
  terminalIds = [],
  airflowCfm,
  targetVelocityMps,
  shape = "rectangular",
  widthM,
}) => {
  assertFiniteNonNegative(airflowCfm, "Branch airflow");
  if (!Array.isArray(terminalIds)) throw new Error("Terminal IDs must be an array.");

  const airflowM3s = cfmToM3s(airflowCfm);
  const duct = sizeDuctByVelocity({
    volumeFlowM3s: airflowM3s,
    targetVelocityMps,
    shape,
    widthM,
  });

  return {
    id,
    terminalIds: [...terminalIds],
    airflowCfm,
    airflowM3s,
    ...duct,
  };
};

export const calculateMainSegmentAirflow = ({
  downstreamBranchIds,
  branches,
}) => {
  if (!Array.isArray(downstreamBranchIds) || downstreamBranchIds.length === 0) {
    throw new Error("Downstream branch IDs are required.");
  }
  if (!Array.isArray(branches) || branches.length === 0) {
    throw new Error("Branches are required.");
  }

  const branchMap = new Map(branches.map((branch) => [branch.id, branch]));
  let airflowCfm = 0;

  for (const branchId of downstreamBranchIds) {
    const branch = branchMap.get(branchId);
    if (!branch) throw new Error(`Unknown downstream branch: ${branchId}.`);
    assertFiniteNonNegative(branch.airflowCfm, `Branch ${branchId} airflow`);
    airflowCfm += branch.airflowCfm;
  }

  return {
    airflowCfm,
    airflowM3s: cfmToM3s(airflowCfm),
  };
};

export const sizeMainDuct = ({
  id,
  downstreamBranchIds,
  branches,
  targetVelocityMps,
  shape = "rectangular",
  widthM,
}) => {
  const airflow = calculateMainSegmentAirflow({ downstreamBranchIds, branches });
  const duct = sizeDuctByVelocity({
    volumeFlowM3s: airflow.airflowM3s,
    targetVelocityMps,
    shape,
    widthM,
  });

  return {
    id,
    downstreamBranchIds: [...downstreamBranchIds],
    ...airflow,
    ...duct,
  };
};

export const buildDuctDistribution = ({
  branches,
  mainSections = [],
}) => {
  if (!Array.isArray(branches) || branches.length === 0) {
    throw new Error("Branches are required.");
  }

  const sizedBranches = branches.map((branch) => {
    if (!branch || typeof branch !== "object") throw new Error("Invalid branch.");

    const airflowCfm = branch.airflowCfm ?? sumTerminalAirflows(branch.terminalAirflowsCfm);

    return sizeBranchDuct({
      id: branch.id,
      terminalIds: branch.terminalIds ?? [],
      airflowCfm,
      targetVelocityMps: branch.targetVelocityMps,
      shape: branch.shape ?? "rectangular",
      widthM: branch.widthM,
    });
  });

  const sizedMainSections = mainSections.map((section) =>
    sizeMainDuct({
      ...section,
      branches: sizedBranches,
    }),
  );

  return {
    branches: sizedBranches,
    mainSections: sizedMainSections,
    totalSupplyAirflowCfm: sumTerminalAirflows(
      sizedBranches.map((branch) => branch.airflowCfm),
    ),
  };
};
