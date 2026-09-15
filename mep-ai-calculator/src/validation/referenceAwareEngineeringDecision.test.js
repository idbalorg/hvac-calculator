import { buildReferenceAwareEngineeringDecision } from "../engineering/review/referenceAwareEngineeringDecision.js";

const baseReview = {
  status: "PASS",
  roomChecks: [{ roomId: "R1", coolingLoad: { status: "PASS", message: "ok" }, supplyAirflow: { status: "PASS", message: "ok" }, ventilation: { status: "NOT_REQUIRED", message: "ok" } }],
  equipmentChecks: [{ equipmentId: "AC-01", capacity: { status: "PASS", message: "ok" }, airflow: { status: "PASS", message: "ok" }, esp: { status: "NOT_REQUIRED", message: "ok" }, manufacturerData: { status: "PASS", message: "ok" } }],
  projectChecks: { ductCompleteness: { status: "NOT_REQUIRED", message: "ok" }, weatherDesignCondition: { status: "PASS", message: "ok" }, operatingCondition: { status: "PASS", message: "ok" }, acousticCriteria: { status: "NOT_REQUIRED", message: "ok" }, refrigerantPiping: { status: "PASS", message: "ok" }, systemArrangement: { status: "PASS", message: "ok" } },
};

export const runReferenceAwareEngineeringDecisionTests = () => {
  const tests = [];
  const run = (id, name, condition, error) => {
    if (!condition) throw new Error(error || name);
    tests.push({ id, name, passed: true });
  };

  const clear = buildReferenceAwareEngineeringDecision({ engineeringReview: baseReview });
  run("REFDEC-001", "No reference review preserves approval-ready decision", clear.status === "READY_FOR_ENGINEERING_APPROVAL" && clear.referenceDecision.status === "NOT_REQUIRED", "Unexpected clear decision");

  const pass = buildReferenceAwareEngineeringDecision({ engineeringReview: baseReview, referenceReview: { status: "PASS", roomChecks: [{ roomId: "R1", status: "PASS", integrity: { passed: true, errors: [] } }] } });
  run("REFDEC-002", "Valid reference review adds no exception", pass.exceptions.length === 0 && pass.status === "READY_FOR_ENGINEERING_APPROVAL", "Valid reference review should not block approval");

  const missing = buildReferenceAwareEngineeringDecision({ engineeringReview: baseReview, referenceReview: { status: "REVIEW_REQUIRED", roomChecks: [{ roomId: "R1", status: "REVIEW_REQUIRED", message: "Missing reference trace", integrity: { passed: false, errors: ["trace missing"] } }] } });
  run("REFDEC-003", "Reference integrity failure becomes decision exception", missing.status === "REVIEW_REQUIRED" && missing.summary.referenceReviewExceptionCount === 1, "Reference failure should require review");

  run("REFDEC-004", "Reference exception retains room scope", missing.exceptions[0]?.scope === "R1", "Reference exception scope lost");
  run("REFDEC-005", "Reference exception remains medium severity", missing.exceptions[0]?.severity === "MEDIUM", "Reference exception severity changed");
  run("REFDEC-006", "Reference exception contains actionable evidence", missing.exceptions[0]?.recommendedAction?.length > 0 && missing.exceptions[0]?.integrityErrors?.length === 1, "Reference exception lacks evidence/action");

  const blocked = buildReferenceAwareEngineeringDecision({ engineeringReview: { ...baseReview, equipmentChecks: [{ ...baseReview.equipmentChecks[0], capacity: { status: "REVIEW_REQUIRED", message: "Capacity issue" } }] }, referenceReview: { status: "REVIEW_REQUIRED", roomChecks: [{ roomId: "R1", status: "REVIEW_REQUIRED", message: "Trace issue", integrity: { passed: false, errors: ["mismatch"] } }] } });
  run("REFDEC-007", "Base critical engineering exception remains authoritative", blocked.status === "BLOCKED" && blocked.summary.criticalCount === 1 && blocked.summary.referenceReviewExceptionCount === 1, "Base critical gate was not preserved");

  const reviewInput = JSON.parse(JSON.stringify(baseReview));
  const before = JSON.stringify(reviewInput);
  buildReferenceAwareEngineeringDecision({ engineeringReview: reviewInput, referenceReview: { status: "REVIEW_REQUIRED", roomChecks: [{ roomId: "R1", status: "REVIEW_REQUIRED", message: "Trace issue", integrity: { passed: false, errors: ["mismatch"] } }] } });
  run("REFDEC-008", "Decision gate does not mutate engineering review", JSON.stringify(reviewInput) === before, "Engineering review input was mutated");

  return tests;
};
