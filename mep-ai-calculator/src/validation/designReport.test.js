import {
  buildDuctSchedule,
  buildEquipmentSchedule,
  buildRoomSchedule,
  summarizeSchedules,
} from "../engineering/report/designSchedules.js";
import { buildDesignReport, validateDesignPackage } from "../engineering/report/designReport.js";

const approx = (actual, expected, tolerance = 1e-9) => Math.abs(actual - expected) <= tolerance;
const pass = (id, name) => ({ id, name, passed: true });
const expectThrows = (fn) => {
  try { fn(); return false; } catch { return true; }
};

const rooms = [
  {
    roomId: "RM-01",
    roomName: "Open Office",
    areaM2: 60,
    sensibleLoadKw: 6,
    latentLoadKw: 1.5,
    supplyAirflowCfm: 900,
    terminalCount: 2,
  },
  {
    roomId: "RM-02",
    roomName: "Meeting Room",
    areaM2: 30,
    sensibleLoadKw: 3,
    latentLoadKw: 0.5,
    supplyAirflowCfm: 450,
    terminalCount: 1,
  },
];

const equipment = [
  {
    equipmentId: "AC-01",
    systemId: "SYS-01",
    type: "Ceiling Cassette",
    indoorUnit: "Indoor-01",
    outdoorUnit: "Outdoor-01",
    capacityKw: 8.5,
    requiredCapacityKw: 7.5,
    designAirflowCfm: 900,
    selectedAirflowCfm: 950,
    requiredEspPa: 300,
    selectedEspPa: 350,
  },
  {
    equipmentId: "AC-02",
    systemId: "SYS-01",
    type: "Ceiling Cassette",
    indoorUnit: "Indoor-02",
    outdoorUnit: "Outdoor-02",
    capacityKw: 4,
    requiredCapacityKw: 3.5,
    designAirflowCfm: 450,
    selectedAirflowCfm: 450,
    requiredEspPa: 250,
    selectedEspPa: 300,
  },
];

const ducts = [
  { ductId: "D-01", systemId: "SYS-01", sectionType: "MAIN", airflowCfm: 1350, widthM: 0.6, heightM: 0.3, velocityMps: 3.2, pressureLossPa: 20 },
  { ductId: "D-02", systemId: "SYS-01", sectionType: "BRANCH", airflowCfm: 900, widthM: 0.45, heightM: 0.25, velocityMps: 2.8, pressureLossPa: 15 },
  { ductId: "D-03", systemId: "SYS-01", sectionType: "BRANCH", airflowCfm: 450, widthM: 0.3, heightM: 0.2, velocityMps: 2.6, pressureLossPa: 12 },
];

export const runDesignReportTests = () => {
  const tests = [];

  const roomSchedule = buildRoomSchedule({ rooms });
  if (roomSchedule.length !== 2 || !approx(roomSchedule[0].totalLoadKw, 7.5) || !approx(roomSchedule[0].sensibleHeatRatio, 0.8)) {
    throw new Error("Room schedule calculation failed");
  }
  tests.push(pass("UNIT-REPORT-001", "Room-by-room HVAC schedule"));

  if (roomSchedule[0].roomName !== "Open Office" || roomSchedule[1].supplyAirflowCfm !== 450 || roomSchedule[0].terminalCount !== 2) {
    throw new Error("Room schedule fields failed");
  }
  tests.push(pass("UNIT-REPORT-002", "Room schedule engineering fields"));

  const equipmentSchedule = buildEquipmentSchedule({ equipment });
  if (!approx(equipmentSchedule[0].capacityMarginPercent, 13.333333333333334) || !approx(equipmentSchedule[0].espMarginPercent, 16.666666666666664)) {
    throw new Error("Equipment schedule margin calculation failed");
  }
  tests.push(pass("UNIT-REPORT-003", "Equipment schedule and capacity/ESP margins"));

  const ductSchedule = buildDuctSchedule({ ducts });
  if (ductSchedule.length !== 3 || ductSchedule[0].sectionType !== "MAIN" || ductSchedule[1].widthM !== 0.45) {
    throw new Error("Duct schedule fields failed");
  }
  tests.push(pass("UNIT-REPORT-004", "Duct schedule"));

  const summary = summarizeSchedules({ rooms: roomSchedule, equipment: equipmentSchedule, ducts: ductSchedule });
  if (
    !approx(summary.totalCoolingLoadKw, 11) ||
    !approx(summary.totalSensibleLoadKw, 9) ||
    !approx(summary.totalLatentLoadKw, 2) ||
    summary.totalSupplyAirflowCfm !== 1350 ||
    !approx(summary.totalInstalledCapacityKw, 12.5) ||
    !approx(summary.totalDuctPressureLossPa, 47)
  ) throw new Error("Design schedule summary failed");
  tests.push(pass("UNIT-REPORT-005", "Project schedule summary"));

  const criteria = {
    minimumCapacityMarginPercent: 0,
    maximumCapacityOversizePercent: 15,
    minimumAirflowRatio: 1,
    minimumEspRatio: 1,
  };
  const validation = validateDesignPackage({ summary, equipmentSchedule, criteria });
  if (!validation.passed || validation.equipmentChecks.length !== 2) throw new Error("Valid design package was rejected");
  tests.push(pass("UNIT-REPORT-006", "Design package validation pass"));

  const failedEquipment = buildEquipmentSchedule({
    equipment: [{ ...equipment[0], capacityKw: 10, requiredCapacityKw: 7.5, selectedAirflowCfm: 800, selectedEspPa: 250 }],
  });
  const failedValidation = validateDesignPackage({
    summary,
    equipmentSchedule: failedEquipment,
    criteria,
    systemSummary: { status: "FAIL" },
  });
  if (failedValidation.passed || failedValidation.equipmentChecks[0].capacity.status !== "FAIL" || failedValidation.equipmentChecks[0].airflow.status !== "FAIL" || failedValidation.equipmentChecks[0].esp.status !== "FAIL") {
    throw new Error("Failed design package was incorrectly accepted");
  }
  tests.push(pass("UNIT-REPORT-007", "Design package validation failure detection"));

  const report = buildDesignReport({
    project: { projectId: "HVAC-001", projectName: "Lagos Office", location: "Lagos, Nigeria" },
    rooms,
    equipment,
    ducts,
    systemSummary: { systemId: "SYS-01", status: "PASS" },
    criteria,
    generatedAt: "2026-09-04T12:00:00Z",
  });
  if (
    report.reportVersion !== "1.0" ||
    report.project.projectId !== "HVAC-001" ||
    report.schedules.rooms.length !== 2 ||
    report.schedules.equipment.length !== 2 ||
    report.schedules.ducts.length !== 3 ||
    report.summary.totalSupplyAirflowCfm !== 1350 ||
    !report.validation.passed
  ) throw new Error("Complete design report assembly failed");
  tests.push(pass("UNIT-REPORT-008", "Complete structured design report"));

  if (!expectThrows(() => buildRoomSchedule({ rooms: [] }))) throw new Error("Empty room schedule was not rejected");
  if (!expectThrows(() => buildEquipmentSchedule({ equipment: [{ ...equipment[0], capacityKw: 0 }] }))) throw new Error("Zero equipment capacity was not rejected");
  if (!expectThrows(() => buildDuctSchedule({ ducts: [{ ...ducts[0], pressureLossPa: -1 }] }))) throw new Error("Negative duct pressure loss was not rejected");
  if (!expectThrows(() => buildDesignReport({ project: {}, rooms, equipment, ducts }))) throw new Error("Missing report criteria was not rejected");
  tests.push(pass("UNIT-REPORT-009", "Design report input validation"));

  return tests;
};
