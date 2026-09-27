import { buildEngineeringApprovalGate } from "../engineering/review/engineeringApprovalGate.js";

export const runEngineeringApprovalGateTests = () => {
  const tests = [];

  const approved = buildEngineeringApprovalGate({
    engineeringDecision: { status: "READY_FOR_ENGINEERING_APPROVAL", exceptions: [] },
    approval: {
      status: "APPROVED",
      approver: "Engineer A",
      reason: "Design reviewed",
      evidenceReference: "REV-050",
    },
  });
  if (approved.status !== "APPROVED" || !approved.approved || !approved.canApprove) throw new Error("GATE-001 failed");
  tests.push({ id: "GATE-001", name: "Approval-ready decision can produce an explicit approval record", passed: true });

  const reviewRequired = buildEngineeringApprovalGate({
    engineeringDecision: {
      status: "REVIEW_REQUIRED",
      exceptions: [{ id: "EXC-001", severity: "HIGH" }],
    },
    approval: {
      status: "APPROVED",
      approver: "Engineer A",
      reason: "Exception resolved",
      evidenceReference: "REV-051",
      overrides: [{
        exceptionId: "EXC-001",
        approver: "Engineer A",
        reason: "Verified against revised evidence",
        evidenceReference: "EVD-051",
        timestamp: "2026-09-27T10:00:00Z",
      }],
    },
  });
  if (reviewRequired.status !== "APPROVED_WITH_OVERRIDES" || !reviewRequired.approved) throw new Error("GATE-002 failed");
  tests.push({ id: "GATE-002", name: "Review-required decision requires a valid documented override", passed: true });

  const blocked = buildEngineeringApprovalGate({
    engineeringDecision: {
      status: "BLOCKED",
      exceptions: [{ id: "EXC-002", severity: "CRITICAL" }],
    },
    approval: { status: "APPROVED", approver: "Engineer A", reason: "Reviewed", evidenceReference: "REV-052" },
  });
  if (blocked.status !== "BLOCKED" || blocked.approved) throw new Error("GATE-003 failed");
  tests.push({ id: "GATE-003", name: "Blocked decision cannot enter engineering approval", passed: true });

  const immutableDecision = { status: "READY_FOR_ENGINEERING_APPROVAL", exceptions: [] };
  const snapshot = JSON.stringify(immutableDecision);
  buildEngineeringApprovalGate({
    engineeringDecision: immutableDecision,
    approval: { status: "APPROVED", approver: "Engineer A", reason: "Reviewed", evidenceReference: "REV-053" },
  });
  if (JSON.stringify(immutableDecision) !== snapshot) throw new Error("GATE-004 failed");
  tests.push({ id: "GATE-004", name: "Approval gate does not mutate the decision input", passed: true });

  return tests;
};
