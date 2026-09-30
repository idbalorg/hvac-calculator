import { buildEngineeringDecision } from "./engineeringDecision.js";

const REF_SEVERITY_WEIGHT = 2;

/**
 * Stage 40: connect Stage 39 reference review evidence to the existing
 * engineering decision gate. Reference integrity issues become explicit
 * workflow exceptions without changing engineering inputs or calculations.
 */
export const buildReferenceAwareEngineeringDecision = ({
  engineeringReview,
  referenceReview = null,
} = {}) => {
  const decision = buildEngineeringDecision({ engineeringReview });
  const roomChecks = Array.isArray(referenceReview?.roomChecks) ? referenceReview.roomChecks : [];
  const referenceExceptions = roomChecks
    .filter((check) => check?.status === "REVIEW_REQUIRED")
    .map((check, index) => ({
      id: `REF-EXC-${String(index + 1).padStart(3, "0")}`,
      severity: "MEDIUM",
      scope: check.roomId,
      check: "Reference trace integrity",
      message: check.message || "Reference trace integrity requires engineering review",
      recommendedAction: "Verify the applied reference provenance and supporting engineering evidence before approval.",
      source: "STAGE_39_REFERENCE_REVIEW",
      integrityErrors: check.integrity?.errors ?? [],
    }));

  const exceptions = [...decision.exceptions, ...referenceExceptions];
  const criticalCount = exceptions.filter((item) => item.severity === "CRITICAL").length;
  const highCount = exceptions.filter((item) => item.severity === "HIGH").length;
  const mediumCount = exceptions.filter((item) => item.severity === "MEDIUM").length;
  const lowCount = exceptions.filter((item) => item.severity === "LOW").length;
  const readinessScore = Math.max(0, Math.min(100, decision.readinessScore - referenceExceptions.length * REF_SEVERITY_WEIGHT * 5));
  const status = criticalCount > 0 ? "BLOCKED" : exceptions.length > 0 ? "REVIEW_REQUIRED" : "READY_FOR_ENGINEERING_APPROVAL";

  return {
    ...decision,
    status,
    readinessScore,
    summary: {
      exceptionCount: exceptions.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      referenceReviewExceptionCount: referenceExceptions.length,
    },
    exceptions,
    referenceDecision: {
      applied: referenceReview?.status !== "NOT_REQUIRED" && referenceReview != null,
      status: referenceReview?.status || "NOT_REQUIRED",
      reviewRequired: referenceExceptions.length,
      boundary: "Reference provenance is an engineering evidence gate. It cannot silently correct inputs, establish code compliance, or replace engineer-of-record judgment.",
    },
    methodology: "Base engineering review + reference trace integrity review → unified exceptions → readiness decision",
  };
};
