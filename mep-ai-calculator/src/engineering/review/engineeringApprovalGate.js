import { buildEngineeringApproval } from "./engineeringApproval.js";

const ACCEPTABLE_DECISION_STATUSES = new Set([
  "READY_FOR_ENGINEERING_APPROVAL",
  "REVIEW_REQUIRED",
]);

export const buildEngineeringApprovalGate = ({ engineeringDecision, approval = null }) => {
  if (!engineeringDecision || typeof engineeringDecision !== "object") {
    throw new Error("engineeringDecision is required");
  }

  const decisionStatus = engineeringDecision.status;
  const exceptions = Array.isArray(engineeringDecision.exceptions) ? engineeringDecision.exceptions : [];
  const criticalExceptions = exceptions.filter((item) => item.severity === "CRITICAL");

  if (!ACCEPTABLE_DECISION_STATUSES.has(decisionStatus)) {
    return {
      status: "BLOCKED",
      approved: false,
      canApprove: false,
      decisionStatus,
      reason: "Engineering decision is not in an approval-eligible state.",
      gate: {
        decisionMustBeApprovalEligible: true,
        criticalExceptionsMustBeResolved: true,
        delegatesApprovalRecord: true,
      },
    };
  }

  if (criticalExceptions.length > 0) {
    return {
      status: "BLOCKED",
      approved: false,
      canApprove: false,
      decisionStatus,
      reason: "Critical engineering exceptions must be resolved before approval.",
      gate: {
        decisionMustBeApprovalEligible: true,
        criticalExceptionsMustBeResolved: true,
        delegatesApprovalRecord: true,
      },
    };
  }

  const approvalRecord = buildEngineeringApproval({ engineeringDecision, approval });

  return {
    ...approvalRecord,
    gate: {
      ...approvalRecord.gate,
      decisionMustBeApprovalEligible: true,
      criticalExceptionsMustBeResolved: true,
      delegatesApprovalRecord: true,
    },
    methodology: "Engineering review → engineering decision → approval eligibility gate → accountable engineering approval record",
    boundary: "This integration connects the engineering decision to the existing approval record. It does not certify code compliance, replace engineer-of-record responsibility, or authorize construction by itself.",
  };
};
