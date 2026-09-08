import { buildFinalDesignPackage, summarizeFinalDesignPackage } from "../engineering/report/finalDesignPackage.js";

const expectThrows = (fn) => { try { fn(); return false; } catch { return true; } };

const base = {
  project: { id: "P-001", name: "Test HVAC Project" },
  rooms: [{ id: "R1", name: "Office", areaM2: 50 }],
  loadResults: [{ roomId: "R1", sensibleLoadW: 4000, latentLoadW: 1000, designLoadW: 5500 }],
  airsideResults: [{ roomId: "R1", airflow: { airflowM3s: 0.2 }, terminalCount: 2 }],
  equipment: [{ equipmentId: "AC-01", systemId: "SYS-01", type: "SPLIT_DX", model: "DX-6000", manufacturer: "Daikin", refrigerant: "R32", capacityKw: 6, requiredCapacityKw: 5.5, designAirflowCfm: 424, selectedAirflowCfm: 450, requiredEspPa: 250, selectedEspPa: 300 }],
  ducts: [{ ductId: "D-01", systemId: "SYS-01", sectionType: "BRANCH", airflowCfm: 424, widthM: 0.3, heightM: 0.2, velocityMps: 5.9, pressureLossPa: 30 }],
  systemSummary: { status: "PASS", distributionType: "DUCTED" },
  criteria: { minimumCapacityMarginPercent: 0, maximumCapacityOversizePercent: 15, minimumAirflowRatio: 1, minimumEspRatio: 1, distributionType: "DUCTED", designConditionVerified: true, operatingConditionConfirmed: true, acousticCriteriaRequired: false, refrigerantPipingVerified: true },
  generatedAt: "2026-09-06T00:00:00Z",
};

export const runFinalDesignPackageTests = () => {
  const tests = [];
  const result = buildFinalDesignPackage(base);
  if (result.packageVersion !== "20.0.0") throw new Error("Package version failed"); tests.push({ id: "PKG-001", name: "Package version", passed: true });
  if (result.report.reportVersion !== "1.0") throw new Error("Report version failed"); tests.push({ id: "PKG-002", name: "Report generation", passed: true });
  if (result.report.schedules.rooms.length !== 1 || result.report.schedules.rooms[0].roomId !== "R1") throw new Error("Room schedule failed"); tests.push({ id: "PKG-003", name: "Room schedule", passed: true });
  if (result.report.schedules.equipment.length !== 1 || result.report.schedules.equipment[0].equipmentId !== "AC-01") throw new Error("Equipment schedule failed"); tests.push({ id: "PKG-004", name: "Equipment schedule", passed: true });
  if (result.report.schedules.ducts.length !== 1 || result.report.schedules.ducts[0].ductId !== "D-01") throw new Error("Duct schedule failed"); tests.push({ id: "PKG-005", name: "Duct schedule", passed: true });
  if (result.report.summary.totalCoolingLoadKw !== 5.5 || result.report.summary.totalSupplyAirflowCfm <= 0) throw new Error("Project summary failed"); tests.push({ id: "PKG-006", name: "Project summary", passed: true });
  if (!result.report.validation.passed) throw new Error("Valid design package was rejected"); tests.push({ id: "PKG-007", name: "Design package validation", passed: true });
  const summary = summarizeFinalDesignPackage(result);
  if (summary.roomCount !== 1 || summary.equipmentCount !== 1 || summary.ductCount !== 1 || summary.constructionReady !== false) throw new Error("Package summary failed"); tests.push({ id: "PKG-008", name: "Package summary", passed: true });
  if (!result.readiness.verificationRequired || result.readiness.constructionReady) throw new Error("Engineering boundary failed"); tests.push({ id: "PKG-009", name: "Verification boundary", passed: true });
  if (!expectThrows(() => buildFinalDesignPackage({ ...base, rooms: [] }))) throw new Error("Invalid room input was not rejected");
  if (!expectThrows(() => buildFinalDesignPackage({ ...base, loadResults: [] }))) throw new Error("Missing load results were not rejected"); tests.push({ id: "PKG-010", name: "Input validation", passed: true });
  const direct = buildFinalDesignPackage({ ...base, criteria: { ...base.criteria, distributionType: "DIRECT_DISCHARGE" }, systemSummary: { status: "PASS", distributionType: "DIRECT_DISCHARGE" }, equipment: [{ ...base.equipment[0], requiredEspPa: 0, selectedEspPa: 0 }], ducts: [] });
  if (direct.report.schedules.ducts.length !== 0 || !direct.report.validation.passed) throw new Error("Direct-discharge package failed"); tests.push({ id: "PKG-011", name: "Direct-discharge package without duct schedule", passed: true });
  const current = buildFinalDesignPackage({ ...base, loadResults: [{ roomId: "R1", rawLoad: { sensibleW: 8000, latentW: 2000, totalW: 10000 }, designLoad: { sensibleW: 8800, latentW: 2200, totalW: 11000 } }] }).report.schedules.rooms[0];
  if (current.sensibleLoadKw !== 8 || current.latentLoadKw !== 2 || current.totalLoadKw !== 11) throw new Error("Current cooling-load result shape was not mapped correctly"); tests.push({ id: "PKG-012", name: "Current cooling-load result mapping", passed: true });
  if (!Array.isArray(result.resultTraceability?.records) || result.resultTraceability.records.length < 4) throw new Error("Result traceability records missing");
  const loadTrace = result.resultTraceability.records.find((item) => item.result === "Total cooling load");
  if (!loadTrace || loadTrace.value !== "5.50 kW" || !loadTrace.reference.includes("Fundamentals")) throw new Error("Cooling-load result traceability failed");
  const airflowTrace = result.resultTraceability.records.find((item) => item.result === "Supply airflow");
  if (!airflowTrace || airflowTrace.value === "Not available" || airflowTrace.status !== "CALCULATED") throw new Error("Supply-airflow result traceability failed");
  const equipmentTrace = result.resultTraceability.records.find((item) => item.result === "Selected equipment");
  if (!equipmentTrace || equipmentTrace.status !== "SELECTED_VERIFY" || !equipmentTrace.verification) throw new Error("Equipment result traceability failed");
  const ductTrace = result.resultTraceability.records.find((item) => item.result === "Duct section");
  if (!ductTrace || ductTrace.status !== "CALCULATED_VERIFY" || !ductTrace.reference.includes("SMACNA")) throw new Error("Duct result traceability failed"); tests.push({ id: "PKG-013", name: "Result-level engineering traceability", passed: true });
  if (result.engineeringReview?.status !== "PASS" || result.engineeringReview.summary.reviewRequired !== 0) throw new Error("Complete engineering review did not pass"); tests.push({ id: "PKG-014", name: "Engineering review integrated", passed: true });
  const reviewRequired = buildFinalDesignPackage({ ...base, criteria: { ...base.criteria, designConditionVerified: false } });
  if (reviewRequired.engineeringReview.status !== "REVIEW_REQUIRED" || summarizeFinalDesignPackage(reviewRequired).engineeringReviewStatus !== "REVIEW_REQUIRED") throw new Error("Engineering review boundary failed"); tests.push({ id: "PKG-015", name: "Engineering review boundary", passed: true });
  return tests;
};
