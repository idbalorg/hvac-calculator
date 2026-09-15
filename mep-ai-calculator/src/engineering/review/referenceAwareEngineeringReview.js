import { validateReferenceTraceIntegrity } from "./referenceTraceIntegrity.js";

const normalizeRoomId = (room, index) => room?.roomId ?? `ROOM-${index + 1}`;

const reviewStatus = (passed) => (passed ? "PASS" : "REVIEW_REQUIRED");

/**
 * Stage 39: reference-aware engineering review adapter.
 *
 * This is deliberately non-mutating. The existing engineering review remains
 * authoritative for engineering checks. Reference trace integrity is an
 * additional evidence gate only when a reference was explicitly applied.
 */
export const buildReferenceAwareEngineeringReview = ({
  baseReview = null,
  rooms = [],
  referenceTracesByRoom = {},
  appliedReferenceByRoom = {},
  finalEngineeringInputsByRoom = {},
} = {}) => {
  const roomChecks = rooms.map((room, index) => {
    const roomId = normalizeRoomId(room, index);
    const appliedReference = appliedReferenceByRoom?.[roomId] ?? null;
    const trace = referenceTracesByRoom?.[roomId] ?? null;
    const finalInputs = finalEngineeringInputsByRoom?.[roomId] ?? room?.engineeringInputs ?? null;

    if (!appliedReference) {
      return {
        roomId,
        status: "NOT_REQUIRED",
        message: "No reference was explicitly applied to this room",
        integrity: { passed: true, errors: [] },
      };
    }

    const integrity = validateReferenceTraceIntegrity({ trace, appliedReference, finalInputs });
    return {
      roomId,
      status: reviewStatus(integrity.passed),
      message: integrity.passed
        ? "Applied reference trace is internally consistent"
        : "Applied reference trace requires engineering review",
      integrity,
      engineerOverrideWins: trace?.engineerOverrideWins === true,
      overriddenFields: trace?.overriddenFields ?? [],
    };
  });

  const referenceReviewRequired = roomChecks.filter((check) => check.status === "REVIEW_REQUIRED").length;
  const referenceChecksApplicable = roomChecks.filter((check) => check.status !== "NOT_REQUIRED").length;

  return {
    ...(baseReview || {}),
    referenceReview: {
      version: "1.0",
      status: referenceReviewRequired > 0 ? "REVIEW_REQUIRED" : "PASS",
      summary: {
        roomsReviewed: referenceChecksApplicable,
        reviewRequired: referenceReviewRequired,
        notRequired: roomChecks.filter((check) => check.status === "NOT_REQUIRED").length,
      },
      roomChecks,
      boundary: "Reference integrity is an evidence review gate only. It does not correct engineering inputs, replace the base engineering review, establish code compliance, or promote a reference benchmark into an approved project value.",
    },
  };
};
