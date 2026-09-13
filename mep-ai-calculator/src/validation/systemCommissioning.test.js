import { calculateCommissioningChecks, buildCommissioningChecklist, buildCommissioningHandover, buildDirectDischargeCommissioning } from "../engineering/airside/systemCommissioning.js";

const pass = (id, name) => ({ id, name, passed: true });
const expectThrows = (fn) => { try { fn(); return false; } catch { return true; } };

export const runSystemCommissioningTests = () => {
  const tests = [];
  const base = {
    designAirflowCfm: 700,
    measuredAirflowCfm: 665,
    airflowTolerancePercent: 10,
    designCapacityKw: 8.8,
    measuredCapacityKw: 8.4,
    capacityTolerancePercent: 10,
    requiredFanEspPa: 396,
    measuredFanEspPa: 405,
    espTolerancePercent: 10,
  };
  const checks = calculateCommissioningChecks(base);

  if (!checks.airflowPass || !checks.capacityPass || !checks.espPass || checks.status !== "PASS") throw new Error("Commissioning pass case failed");
  tests.push(pass("COMM-001", "Commissioning pass case"));

  if (Math.abs(checks.airflowDeviationPercent + 5) > 1e-9) throw new Error("Airflow deviation calculation failed");
  tests.push(pass("COMM-002", "Airflow deviation"));

  const action = calculateCommissioningChecks({ ...base, measuredAirflowCfm: 500 });
  if (action.airflowPass || action.status !== "ACTION_REQUIRED") throw new Error("Airflow action case failed");
  tests.push(pass("COMM-003", "Airflow action required"));

  const pending = calculateCommissioningChecks({ ...base, measuredCapacityKw: null, measuredFanEspPa: null });
  if (pending.capacityPass !== null || pending.espPass !== null) throw new Error("Optional commissioning measurements failed");
  tests.push(pass("COMM-004", "Optional capacity and ESP measurements"));

  const checklist = buildCommissioningChecklist({ airflowCheck: checks, capacityCheck: checks, espCheck: checks });
  if (checklist.complete || checklist.items.filter((item) => item.status === "PENDING").length !== 2) throw new Error("Commissioning checklist pending state failed");
  tests.push(pass("COMM-005", "Commissioning checklist"));

  const completeChecklist = buildCommissioningChecklist({ airflowCheck: checks, capacityCheck: checks, espCheck: checks, controlsVerified: true, documentationVerified: true });
  if (!completeChecklist.complete) throw new Error("Complete checklist failed");
  tests.push(pass("COMM-006", "Complete handover checklist"));

  const handover = buildCommissioningHandover({ projectId: "PROJECT-01", systemId: "SYSTEM-01", checks, checklist: completeChecklist });
  if (handover.commissioningStatus !== "READY_FOR_HANDOVER" || handover.verificationRequired !== true) throw new Error("Handover status failed");
  tests.push(pass("COMM-007", "Handover readiness"));

  if (!expectThrows(() => calculateCommissioningChecks({ ...base, designAirflowCfm: 0 }))) throw new Error("Invalid airflow was accepted");
  if (!expectThrows(() => calculateCommissioningChecks({ ...base, measuredAirflowCfm: -1 }))) throw new Error("Negative measurement was accepted");
  if (!expectThrows(() => buildCommissioningHandover({ projectId: "", systemId: "SYSTEM-01", checks, checklist: completeChecklist }))) throw new Error("Invalid project id was accepted");
  tests.push(pass("COMM-008", "Commissioning input validation"));

  const direct = buildDirectDischargeCommissioning({
    systemType: "SPLIT_DX",
    distributionType: "DIRECT_DISCHARGE",
    projectId: "PROJECT-01",
    systemId: "SYSTEM-01",
    checks: {
      equipmentOperational: true,
      roomPerformance: true,
      condensateDrainage: true,
      refrigerantInstallation: true,
      electrical: true,
      controlsVerified: true,
      documentationVerified: true,
    },
  });
  if (direct.checks.status !== "READY_FOR_HANDOVER" || !direct.checklist.complete || !direct.handover.handoverReady) throw new Error("Direct-discharge commissioning path failed");
  if (direct.checks.airflowPass !== null || direct.checks.espPass !== null) throw new Error("Direct-discharge path should not require duct airflow or fan ESP checks");
  tests.push(pass("COMM-009", "Direct-discharge commissioning path"));

  const directPending = buildDirectDischargeCommissioning({ systemType: "SPLIT_DX", projectId: "PROJECT-01", systemId: "SYSTEM-01" });
  if (directPending.checks.status !== "FIELD_VERIFICATION_REQUIRED" || directPending.handover.handoverReady) throw new Error("Direct-discharge pending state failed");
  tests.push(pass("COMM-010", "Direct-discharge pending verification"));

  return tests;
};
