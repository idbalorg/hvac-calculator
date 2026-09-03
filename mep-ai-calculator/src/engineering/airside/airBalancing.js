const assertFiniteNumber = (value, name) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
};

const assertPositive = (value, name) => {
  assertFiniteNumber(value, name);
  if (value <= 0) throw new Error(`${name} must be greater than zero`);
};

/**
 * Determines the critical branch and the balancing damper pressure drop
 * required on each non-critical branch to match the critical path resistance.
 *
 * This is a design target only. Actual damper adjustment requires field
 * measurement and the damper manufacturer's pressure/flow characteristic.
 */
export const calculateBranchBalancing = ({ branchPressureLossesPa, criticalBranchId = null }) => {
  if (!Array.isArray(branchPressureLossesPa) || branchPressureLossesPa.length === 0) {
    throw new Error("branchPressureLossesPa must contain at least one branch");
  }

  const branches = branchPressureLossesPa.map((branch) => {
    if (!branch || typeof branch.id !== "string" || branch.id.trim() === "") {
      throw new Error("Each branch must have a non-empty id");
    }
    assertFiniteNumber(branch.pressureLossPa, `pressureLossPa for ${branch.id}`);
    if (branch.pressureLossPa < 0) {
      throw new Error(`pressureLossPa for ${branch.id} cannot be negative`);
    }
    return { id: branch.id, pressureLossPa: branch.pressureLossPa };
  });

  let criticalBranch;
  if (criticalBranchId !== null) {
    criticalBranch = branches.find((branch) => branch.id === criticalBranchId);
    if (!criticalBranch) throw new Error(`Critical branch ${criticalBranchId} was not found`);
  } else {
    criticalBranch = branches.reduce((max, branch) => (
      branch.pressureLossPa > max.pressureLossPa ? branch : max
    ));
  }

  const results = branches.map((branch) => {
    const isCritical = branch.id === criticalBranch.id;
    const excessPressurePa = Math.max(0, criticalBranch.pressureLossPa - branch.pressureLossPa);
    return {
      ...branch,
      isCritical,
      excessPressurePa,
      balancingDamperPressureDropPa: isCritical ? 0 : excessPressurePa,
    };
  });

  return {
    criticalBranchId: criticalBranch.id,
    criticalPressureLossPa: criticalBranch.pressureLossPa,
    branches: results,
  };
};

export const calculateAirflowDeviation = ({ designAirflowCfm, measuredAirflowCfm }) => {
  assertPositive(designAirflowCfm, "designAirflowCfm");
  assertFiniteNumber(measuredAirflowCfm, "measuredAirflowCfm");
  if (measuredAirflowCfm < 0) throw new Error("measuredAirflowCfm cannot be negative");

  const deviationCfm = measuredAirflowCfm - designAirflowCfm;
  const deviationPercent = (deviationCfm / designAirflowCfm) * 100;

  return {
    designAirflowCfm,
    measuredAirflowCfm,
    deviationCfm,
    deviationPercent,
    absoluteDeviationPercent: Math.abs(deviationPercent),
  };
};

export const classifyAirflowBalance = ({ deviationPercent, tolerancePercent }) => {
  assertFiniteNumber(deviationPercent, "deviationPercent");
  assertPositive(tolerancePercent, "tolerancePercent");

  return Math.abs(deviationPercent) <= tolerancePercent ? "BALANCED" : "ADJUST";
};

export const calculateTerminalBalance = ({
  designAirflowCfm,
  measuredAirflowCfm,
  tolerancePercent,
}) => {
  assertPositive(tolerancePercent, "tolerancePercent");

  const airflow = calculateAirflowDeviation({ designAirflowCfm, measuredAirflowCfm });
  const status = classifyAirflowBalance({
    deviationPercent: airflow.deviationPercent,
    tolerancePercent,
  });

  return {
    ...airflow,
    tolerancePercent,
    status,
  };
};

/**
 * Produces a field balancing report from measured terminal airflows.
 * Each terminal must contain id, optional roomId, designAirflowCfm and
 * measuredAirflowCfm. Tolerance is deliberately supplied by the caller.
 */
export const calculateAirBalanceReport = ({ terminals, tolerancePercent }) => {
  if (!Array.isArray(terminals) || terminals.length === 0) {
    throw new Error("terminals must contain at least one terminal");
  }
  assertPositive(tolerancePercent, "tolerancePercent");

  const rows = terminals.map((terminal) => {
    if (!terminal || typeof terminal.id !== "string" || terminal.id.trim() === "") {
      throw new Error("Each terminal must have a non-empty id");
    }

    return {
      id: terminal.id,
      roomId: terminal.roomId ?? null,
      ...calculateTerminalBalance({
        designAirflowCfm: terminal.designAirflowCfm,
        measuredAirflowCfm: terminal.measuredAirflowCfm,
        tolerancePercent,
      }),
    };
  });

  const balancedCount = rows.filter((row) => row.status === "BALANCED").length;

  return {
    tolerancePercent,
    rows,
    summary: {
      total: rows.length,
      balancedCount,
      adjustmentCount: rows.length - balancedCount,
      balanced: balancedCount === rows.length,
    },
  };
};
