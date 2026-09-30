import { buildReferenceTraceForRoom } from "../engineering/reference/referenceResultIntegration.js";
import { buildReferenceAwareEngineeringReview } from "../engineering/review/referenceAwareEngineeringReview.js";

const appliedReference = {
  inputs: {
    wall: { uValueWm2K: 0.704, construction: "Steel-framed wall" },
    windows: { uValueWm2K: 6.814, shgc: 0.25, glazing: "Vertical glazing, metal framing" },
  },
  referenceBasis: {
    datasetVersion: "1.1.0",
    location: { id: "LAGOS_IKEJA", name: "Lagos Ikeja", sourceRef: "DESIGNCOND-LAGOS-IKEJA" },
    occupantActivity: { id: "OFFICE_TYPING", label: "Office typing", sourceRef: "ASHRAE-55-ACTIVITY" },
    ventilation: { id: "OFFICE_SPACE_62_1_2022", label: "Office space", sourceRef: "ASHRAE-62.1-2022" },
    construction: { id: "STEEL_FRAMED_WALL", sourceRef: "ASHRAE-90.1-2007-T5.5-1", benchmarkOnly: true, verificationRequired: true },
    fenestration: { id: "VERTICAL_METAL_0_40", sourceRef: "ASHRAE-90.1-2007-T5.5-1", benchmarkOnly: true, verificationRequired: true },
    appliedExplicitly: true,
    verificationRequired: true,
  },
};

export const runReferenceAwareEngineeringReviewTests = () => {
  const results = [];
  const check = (id, name, condition) => results.push({ id, name, passed: Boolean(condition) });

  const finalInputs = {
    wall: { uValueWm2K: 0.704, construction: "Steel-framed wall" },
    windows: { uValueWm2K: 5.9, shgc: 0.25, glazing: "Engineer-selected low-e glazing" },
  };
  const trace = buildReferenceTraceForRoom({ engineeringInputs: finalInputs, appliedReference });
  const baseReview = { version: "1.0", status: "PASS", summary: { totalChecks: 1, passed: 1, reviewRequired: 0, failed: 0 } };

  let review = buildReferenceAwareEngineeringReview({
    baseReview,
    rooms: [{ roomId: "R1", roomName: "Office", engineeringInputs: finalInputs }],
    referenceTracesByRoom: { R1: trace },
    appliedReferenceByRoom: { R1: appliedReference },
    finalEngineeringInputsByRoom: { R1: finalInputs },
  });
  check("REFREV-001", "Valid reference trace passes review", review.referenceReview.roomChecks[0].status === "PASS");

  review = buildReferenceAwareEngineeringReview({ baseReview, rooms: [{ roomId: "R1" }] });
  check("REFREV-002", "No applied reference is not a review failure", review.referenceReview.roomChecks[0].status === "NOT_REQUIRED");

  review = buildReferenceAwareEngineeringReview({
    baseReview,
    rooms: [{ roomId: "R1", engineeringInputs: finalInputs }],
    appliedReferenceByRoom: { R1: appliedReference },
    finalEngineeringInputsByRoom: { R1: finalInputs },
  });
  check("REFREV-003", "Missing trace requires review", review.referenceReview.roomChecks[0].status === "REVIEW_REQUIRED");

  const tamperedTrace = JSON.parse(JSON.stringify(trace));
  tamperedTrace.referenceBasis.datasetVersion = "0.0.0";
  review = buildReferenceAwareEngineeringReview({
    baseReview,
    rooms: [{ roomId: "R1", engineeringInputs: finalInputs }],
    referenceTracesByRoom: { R1: tamperedTrace },
    appliedReferenceByRoom: { R1: appliedReference },
    finalEngineeringInputsByRoom: { R1: finalInputs },
  });
  check("REFREV-004", "Trace provenance mismatch requires review", review.referenceReview.roomChecks[0].status === "REVIEW_REQUIRED");

  check("REFREV-005", "Engineer override remains visible", review.referenceReview.roomChecks[0].engineerOverrideWins === true || review.referenceReview.roomChecks[0].engineerOverrideWins === false);

  const secondApplied = JSON.parse(JSON.stringify(appliedReference));
  const secondInputs = { wall: { uValueWm2K: 0.505, construction: "Wood-framed/other wall" }, windows: finalInputs.windows };
  const secondTrace = buildReferenceTraceForRoom({ engineeringInputs: secondInputs, appliedReference: secondApplied });
  review = buildReferenceAwareEngineeringReview({
    baseReview,
    rooms: [{ roomId: "R1", engineeringInputs: finalInputs }, { roomId: "R2", engineeringInputs: secondInputs }],
    referenceTracesByRoom: { R1: trace, R2: secondTrace },
    appliedReferenceByRoom: { R1: appliedReference, R2: secondApplied },
    finalEngineeringInputsByRoom: { R1: finalInputs, R2: secondInputs },
  });
  check("REFREV-006", "Reference checks remain isolated by room", review.referenceReview.roomChecks.length === 2 && review.referenceReview.roomChecks[0].roomId === "R1" && review.referenceReview.roomChecks[1].roomId === "R2");

  const blockedBaseReview = { version: "1.0", status: "REVIEW_REQUIRED", summary: { totalChecks: 1, passed: 0, reviewRequired: 1, failed: 0 } };
  review = buildReferenceAwareEngineeringReview({
    baseReview: blockedBaseReview,
    rooms: [{ roomId: "R1", engineeringInputs: finalInputs }],
    referenceTracesByRoom: { R1: trace },
    appliedReferenceByRoom: { R1: appliedReference },
    finalEngineeringInputsByRoom: { R1: finalInputs },
  });
  check("REFREV-007", "Base engineering review remains authoritative", review.status === "REVIEW_REQUIRED");

  const before = JSON.stringify(finalInputs);
  buildReferenceAwareEngineeringReview({
    baseReview,
    rooms: [{ roomId: "R1", engineeringInputs: finalInputs }],
    referenceTracesByRoom: { R1: trace },
    appliedReferenceByRoom: { R1: appliedReference },
    finalEngineeringInputsByRoom: { R1: finalInputs },
  });
  check("REFREV-008", "Reference review does not mutate engineering inputs", JSON.stringify(finalInputs) === before);

  return results;
};
