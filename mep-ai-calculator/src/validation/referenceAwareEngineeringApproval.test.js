import { buildReferenceAwareEngineeringApproval } from "../engineering/review/referenceAwareEngineeringApproval.js";

export const runReferenceAwareEngineeringApprovalTests = () => {
  const results = [];
  const check = (id, name, condition) => {
    if (!condition) throw new Error(`${id} failed`);
    results.push({ id, name, passed: true });
  };

  const readyDecision = { status: "READY_FOR_ENGINEERING_APPROVAL", readinessScore: 100, exceptions: [] };
  const reviewDecision = {
    status: "REVIEW_REQUIRED",
    readinessScore: 90,
    exceptions: [{ id: "REF-EXC-001", severity: "MEDIUM", scope: "R1", check: "Reference trace integrity", message: "Trace requires review" }],
  };
  const blockedDecision = {
    status: "BLOCKED",
    readinessScore: 75,
    exceptions: [{ id: "EXC-001", severity: "CRITICAL", scope: "R1", check: "Cooling load", message: "Load unresolved" }],
  };
  const completeApproval = {
    status: "APPROVED",
    approver: "Engineer A",
    reason: "Reviewed",
    evidenceReference: "CALC-001",
    timestamp: "2026-09-15T10:00:00Z",
  };

  const pending = buildReferenceAwareEngineeringApproval({ engineeringDecision: readyDecision });
  check("REFAPP-001", "Clean decision enters pending approval", pending.status === "PENDING" && pending.approvalRequired === true);
  check("REFAPP-002", "Decision gate evidence is preserved", pending.decisionGate.status === readyDecision.status && pending.decisionGate.readinessScore === 100);

  const approved = buildReferenceAwareEngineeringApproval({ engineeringDecision: readyDecision, approval: completeApproval });
  check("REFAPP-003", "Explicit approval produces approved status", approved.status === "APPROVED" && approved.approved === true && approved.approver === "Engineer A");

  const unresolved = buildReferenceAwareEngineeringApproval({ engineeringDecision: reviewDecision, approval: completeApproval });
  check("REFAPP-004", "Unresolved reference exception prevents approval", unresolved.status === "PENDING" && unresolved.summary.unresolved === 1 && unresolved.approved === false);

  const overridden = buildReferenceAwareEngineeringApproval({
    engineeringDecision: reviewDecision,
    approval: {
      ...completeApproval,
      overrides: [{ exceptionId: "REF-EXC-001", approver: "Engineer A", reason: "Verified against approved evidence", evidenceReference: "RFI-041", timestamp: "2026-09-15T10:00:00Z" }],
    },
  });
  check("REFAPP-005", "Reference exception can only be resolved by explicit documented override", overridden.status === "APPROVED_WITH_OVERRIDES" && overridden.summary.resolvedByOverride === 1 && overridden.summary.unresolved === 0);

  const blocked = buildReferenceAwareEngineeringApproval({ engineeringDecision: blockedDecision, approval: completeApproval });
  check("REFAPP-006", "Critical decision remains blocked", blocked.status === "BLOCKED" && blocked.summary.unresolvedCritical === 1 && blocked.approved === false);

  const invalidOverride = buildReferenceAwareEngineeringApproval({
    engineeringDecision: reviewDecision,
    approval: {
      ...completeApproval,
      overrides: [{ exceptionId: "REF-EXC-999", approver: "Engineer A", reason: "Unsupported", evidenceReference: "RFI-X", timestamp: "2026-09-15T10:00:00Z" }],
    },
  });
  check("REFAPP-007", "Unknown exception cannot be overridden", invalidOverride.status === "PENDING" && invalidOverride.summary.unresolved === 1 && invalidOverride.overrides.length === 0);

  const before = JSON.stringify(reviewDecision);
  buildReferenceAwareEngineeringApproval({ engineeringDecision: reviewDecision, approval: completeApproval });
  check("REFAPP-008", "Approval gate does not mutate decision input", JSON.stringify(reviewDecision) === before);

  return results;
};
