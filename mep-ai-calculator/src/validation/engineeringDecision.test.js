import { buildEngineeringDecision } from "../engineering/review/engineeringDecision.js";

export const runEngineeringDecisionTests = () => {
  const baseReview = {
    status: "PASS",
    roomChecks: [{ roomId: "R1", coolingLoad: { status: "PASS", message: "ok" }, supplyAirflow: { status: "PASS", message: "ok" }, ventilation: { status: "NOT_REQUIRED", message: "ok" } }],
    equipmentChecks: [{ equipmentId: "AC-01", capacity: { status: "PASS", message: "ok" }, airflow: { status: "PASS", message: "ok" }, esp: { status: "NOT_REQUIRED", message: "ok" }, manufacturerData: { status: "PASS", message: "ok" } }],
    projectChecks: {
      ductCompleteness: { status: "NOT_REQUIRED", message: "ok" },
      weatherDesignCondition: { status: "PASS", message: "ok" },
      operatingCondition: { status: "PASS", message: "ok" },
      acousticCriteria: { status: "NOT_REQUIRED", message: "ok" },
      refrigerantPiping: { status: "PASS", message: "ok" },
      systemArrangement: { status: "PASS", message: "ok" },
    },
  };
  const tests = [];

  const clear = buildEngineeringDecision({ engineeringReview: baseReview });
  if (clear.status !== "READY_FOR_ENGINEERING_APPROVAL" || clear.readinessScore !== 100 || clear.exceptions.length !== 0) throw new Error("Clear review should be ready for engineering approval");
  tests.push({ id: "DEC-001", name: "Clear review is approval-ready", passed: true });

  const weather = buildEngineeringDecision({ engineeringReview: { ...baseReview, projectChecks: { ...baseReview.projectChecks, weatherDesignCondition: { status: "REVIEW_REQUIRED", message: "Verify weather" } } } });
  if (weather.status !== "REVIEW_REQUIRED" || weather.summary.highCount !== 1 || weather.exceptions[0].recommendedAction.length === 0) throw new Error("Weather exception should be actionable");
  tests.push({ id: "DEC-002", name: "High-priority exception has corrective action", passed: true });

  const capacity = buildEngineeringDecision({ engineeringReview: { ...baseReview, equipmentChecks: [{ ...baseReview.equipmentChecks[0], capacity: { status: "REVIEW_REQUIRED", message: "Capacity below requirement" } }] } });
  if (capacity.status !== "BLOCKED" || capacity.summary.criticalCount !== 1 || capacity.readinessScore >= 100) throw new Error("Capacity exception should block approval");
  tests.push({ id: "DEC-003", name: "Critical capacity exception blocks approval", passed: true });

  const multiple = buildEngineeringDecision({ engineeringReview: { ...baseReview, projectChecks: { ...baseReview.projectChecks, operatingCondition: { status: "REVIEW_REQUIRED", message: "Confirm operating condition" }, acousticCriteria: { status: "REVIEW_REQUIRED", message: "Verify acoustics" } } } });
  if (multiple.summary.exceptionCount !== 2 || multiple.status !== "REVIEW_REQUIRED") throw new Error("Multiple review exceptions should be summarized");
  tests.push({ id: "DEC-004", name: "Multiple exceptions are summarized", passed: true });

  return tests;
};
