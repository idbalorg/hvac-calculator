const REQUIRED_APPROVAL_FIELDS = ["approver", "reason", "evidenceReference"];

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

const normalizeOverride = (item) => ({
  exceptionId: item?.exceptionId || "",
  approver: item?.approver || "",
  reason: item?.reason || "",
  evidenceReference: item?.evidenceReference || "",
  timestamp: item?.timestamp || null,
});

const validOverride = (item, exceptionIds) => (
  exceptionIds.has(item.exceptionId) &&
  hasText(item.approver) &&
  hasText(item.reason) &&
  hasText(item.evidenceReference) &&
  hasText(item.timestamp)
);

export const buildEngineeringApproval = ({ engineeringDecision, approval = null }) => {
  if (!engineeringDecision || typeof engineeringDecision !== "object") {
    throw new Error("engineeringDecision is required");
  }

  const exceptions = Array.isArray(engineeringDecision.exceptions) ? engineeringDecision.exceptions : [];
  const exceptionIds = new Set(exceptions.map((item) => item.id));
  const overrides = Array.isArray(approval?.overrides) ? approval.overrides.map(normalizeOverride) : [];
  const validOverrides = overrides.filter((item) => validOverride(item, exceptionIds));
  const overriddenIds = new Set(validOverrides.map((item) => item.exceptionId));
  const unresolvedExceptions = exceptions.filter((item) => !overriddenIds.has(item.id));
  const unresolvedCritical = unresolvedExceptions.filter((item) => item.severity === "CRITICAL");
  const unresolvedReviewItems = unresolvedExceptions.length;

  const requestedStatus = approval?.status || "PENDING";
  const fieldsComplete = REQUIRED_APPROVAL_FIELDS.every((field) => hasText(approval?.[field]));
  const canApprove = fieldsComplete && unresolvedReviewItems === 0;
  const approved = requestedStatus === "APPROVED" || requestedStatus === "APPROVED_WITH_OVERRIDES";

  let status = "PENDING";
  if (approved && canApprove) {
    status = validOverrides.length > 0 ? "APPROVED_WITH_OVERRIDES" : "APPROVED";
  } else if (approved && unresolvedCritical.length > 0) {
    status = "BLOCKED";
  } else if (approved) {
    status = "PENDING";
  }

  return {
    version: "1.0",
    status,
    approvalRequired: true,
    canApprove,
    approved: status === "APPROVED" || status === "APPROVED_WITH_OVERRIDES",
    approver: approval?.approver || null,
    reason: approval?.reason || null,
    evidenceReference: approval?.evidenceReference || null,
    timestamp: approval?.timestamp || null,
    overrides: validOverrides,
    unresolvedExceptions,
    summary: {
      totalExceptions: exceptions.length,
      resolvedByOverride: validOverrides.length,
      unresolved: unresolvedExceptions.length,
      unresolvedCritical: unresolvedCritical.length,
    },
    gate: {
      engineeringDecisionStatus: engineeringDecision.status,
      criticalExceptionsMustBeResolved: true,
      reviewExceptionsMustBeResolved: true,
      explicitApprovalRequired: true,
      overrideRequiresReasonAndEvidence: true,
    },
    methodology: "Engineering decision → resolve exceptions or document explicit overrides → record accountable engineer approval → approval status",
    boundary: "Approval is an explicit engineering workflow action. This gate does not certify code compliance, replace engineer-of-record responsibility, or authorize construction by itself. Overrides must identify the affected exception, accountable approver, reason and evidence/reference.",
  };
};

export const validateEngineeringApproval = (approval) => {
  const missing = REQUIRED_APPROVAL_FIELDS.filter((field) => !hasText(approval?.[field]));
  return {
    valid: missing.length === 0,
    missing,
  };
};
