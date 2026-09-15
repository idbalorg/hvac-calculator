import { buildEngineeringApproval } from "./engineeringApproval.js";

/**
 * Stage 41: connect the unified engineering decision output to the explicit
 * engineering approval gate. This is workflow integration only. It does not
 * resolve exceptions, alter calculations, or replace engineer judgement.
 */
export const buildReferenceAwareEngineeringApproval = ({
  engineeringDecision,
  approval = null,
} = {}) => {
  if (!engineeringDecision || typeof engineeringDecision !== "object") {
    throw new Error("engineeringDecision is required");
  }

  const approvalResult = buildEngineeringApproval({ engineeringDecision, approval });

  return {
    ...approvalResult,
    decisionGate: {
      status: engineeringDecision.status,
      readinessScore: engineeringDecision.readinessScore,
      exceptionCount: Array.isArray(engineeringDecision.exceptions) ? engineeringDecision.exceptions.length : 0,
    },
    workflow: {
      stage: "STAGE_41_ENGINEERING_APPROVAL",
      approvalRequired: true,
      decisionMustBeResolvedOrExplicitlyOverridden: true,
      approvalDoesNotModifyEngineeringDecision: true,
    },
    boundary: "Approval records accountable engineering acceptance after the decision gate. It does not certify code compliance, alter engineering calculations, or replace engineer-of-record responsibility.",
  };
};
