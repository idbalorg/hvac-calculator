import { buildEngineeringApproval, validateEngineeringApproval } from "../engineering/review/engineeringApproval.js";

const cleanDecision = { status: "READY_FOR_ENGINEERING_APPROVAL", exceptions: [] };
const decisionWithCritical = { status: "BLOCKED", exceptions: [{ id: "EXC-001", severity: "CRITICAL" }] };

export const runEngineeringApprovalTests = () => [
  (() => {
    const result = buildEngineeringApproval({ engineeringDecision: cleanDecision });
    if (result.status !== "PENDING" || result.canApprove !== false || result.approved !== false) throw new Error("APP-001 failed");
    return { id: "APP-001", name: "Approval remains pending until explicit approval is recorded", passed: true };
  })(),
  (() => {
    const result = buildEngineeringApproval({
      engineeringDecision: decisionWithCritical,
      approval: { status: "APPROVED", approver: "Engineer A", reason: "Reviewed", evidenceReference: "CALC-001", timestamp: "2026-09-08T10:00:00Z" },
    });
    if (result.status !== "BLOCKED" || result.approved) throw new Error("APP-002 failed");
    return { id: "APP-002", name: "Critical exception blocks approval", passed: true };
  })(),
  (() => {
    const result = validateEngineeringApproval({ approver: "Engineer A", reason: "Reviewed" });
    if (result.valid || result.missing[0] !== "evidenceReference") throw new Error("APP-005 failed");
    return { id: "APP-005", name: "Approval requires evidence reference", passed: true };
  })(),
];
