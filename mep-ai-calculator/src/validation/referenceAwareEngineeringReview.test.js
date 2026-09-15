import { buildReferenceAwareEngineeringReview } from "../engineering/review/referenceAwareEngineeringReview.js";

const runCase = (id, name, assertion) => {
  try {
    assertion();
    return { id, name, passed: true };
  } catch (error) {
    return { id, name, passed: false, error: error instanceof Error ? error.message : String(error) };
  }
};

const baseReviewInput = {
  rooms: [{ roomId: "ROOM-1", roomName: "Open Office", totalLoadKw: 10, supplyAirflowCfm: 100, outdoorAirflowCfm: 20, dedicatedVentilationRequired: true }],
  equipment: [{ equipmentId: "EQ-1", requiredCapacityKw: 10, capacityKw: 12, designAirflowCfm: 100, selectedAirflowCfm: 120, requiredEspPa: 0, selectedEspPa: 0, manufacturer: "Daikin", model: "Test-1", type: "Split DX" }],
  ducts: [],
  systemSummary: { status: "PASS", distributionType: "DIRECT" },
  criteria: { ventilationRequired: true, designConditionVerified: true, operatingConditionConfirmed: true, acousticCriteriaRequired: false, refrigerantPipingVerified: true, distributionType: "DIRECT" },
};

const appliedReference = {
  inputs: { wall: { uValueWm2K: 0.704, construction: "Steel-framed wall" }, windows: { uValueWm2K: 6.814, shgc: 0.25, glazing: "Vertical glazing, metal framing" } },
  referenceBasis: {
    datasetVersion: "1.1.0",
    location: { id: "LAGOS_IKEJA", sourceRef: "DESIGNCOND-LAGOS-IKEJA" },
    occupantActivity: { id: "OFFICE_TYPING", sourceRef: "ASHRAE-55-ACTIVITY" },
    ventilation: { id: "OFFICE_SPACE_62_1_2022", sourceRef: "ASHRAE-62.1-2022" },
    construction: { id: "STEEL_FRAMED_WALL", sourceRef: "ASHRAE-90.1-2007-T5.5-1", benchmarkOnly: true, verificationRequired: true },
    fenestration: { id: "VERTICAL_METAL_0_40", sourceRef: "ASHRAE-90.1-2007-T5.5-1", benchmarkOnly: true, verificationRequired: true },
    appliedExplicitly: true,
    verificationRequired: true,
  },
};

const finalInputs = { wall: { uValueWm2K: 0.704, construction: "Steel-framed wall" }, windows: { uValueWm2K: 5.9, shgc: 0.25, glazing: "Engineer-selected low-e glazing" } };
const validTrace = {
  referenceBasis: appliedReference.referenceBasis,
  explicitApplication: true,
  verificationRequired: true,
  fields: [
    { label: "Wall U-value", referenceValue: 0.704, finalValue: 0.704, overridden: false },
    { label: "Wall construction", referenceValue: "Steel-framed wall", finalValue: "Steel-framed wall", overridden: false },
    { label: "Window U-value", referenceValue: 6.814, finalValue: 5.9, overridden: true },
    { label: "Window SHGC", referenceValue: 0.25, finalValue: 0.25, overridden: false },
    { label: "Glazing description", referenceValue: "Vertical glazing, metal framing", finalValue: "Engineer-selected low-e glazing", overridden: true },
  ],
  overriddenFields: [{ label: "Window U-value", referenceValue: 6.814, finalValue: 5.9, overridden: true }, { label: "Glazing description", referenceValue: "Vertical glazing, metal framing", finalValue: "Engineer-selected low-e glazing", overridden: true }],
  engineerOverrideWins: true,
};

export const runReferenceAwareEngineeringReviewTests = () => [
  runCase("REFREV-001", "Valid reference trace passes review", () => {
    const r = buildReferenceAwareEngineeringReview({ ...baseReviewInput, referenceTraceByRoom: { "ROOM-1": validTrace }, appliedReferenceByRoom: { "ROOM-1": appliedReference }, engineeringByRoom: { "ROOM-1": finalInputs } });
    if (r.referenceChecks[0].status !== "PASS") throw new Error("valid reference trace should pass");
  }),
  runCase("REFREV-002", "No applied reference is not a review failure", () => {
    const r = buildReferenceAwareEngineeringReview(baseReviewInput);
    if (r.referenceChecks[0].status !== "NOT_REQUIRED" || r.status !== "PASS") throw new Error("unapplied reference should be not required");
  }),
  runCase("REFREV-003", "Missing trace requires review", () => {
    const r = buildReferenceAwareEngineeringReview({ ...baseReviewInput, appliedReferenceByRoom: { "ROOM-1": appliedReference }, engineeringByRoom: { "ROOM-1": finalInputs } });
    if (r.status !== "REVIEW_REQUIRED") throw new Error("missing trace should require review");
  }),
  runCase("REFREV-004", "Trace provenance mismatch requires review", () => {
    const badTrace = { ...validTrace, referenceBasis: { ...validTrace.referenceBasis, datasetVersion: "0.0.0" } };
    const r = buildReferenceAwareEngineeringReview({ ...baseReviewInput, referenceTraceByRoom: { "ROOM-1": badTrace }, appliedReferenceByRoom: { "ROOM-1": appliedReference }, engineeringByRoom: { "ROOM-1": finalInputs } });
    if (r.status !== "REVIEW_REQUIRED") throw new Error("provenance mismatch should require review");
  }),
  runCase("REFREV-005", "Engineer override remains visible", () => {
    const r = buildReferenceAwareEngineeringReview({ ...baseReviewInput, referenceTraceByRoom: { "ROOM-1": validTrace }, appliedReferenceByRoom: { "ROOM-1": appliedReference }, engineeringByRoom: { "ROOM-1": finalInputs } });
    if (!r.referenceChecks[0].message.includes("internally consistent")) throw new Error("valid override trace should remain reviewable");
  }),
  runCase("REFREV-006", "Reference checks are isolated by room", () => {
    const rooms = [...baseReviewInput.rooms, { roomId: "ROOM-2", roomName: "Meeting Room", totalLoadKw: 5, supplyAirflowCfm: 50, outdoorAirflowCfm: 10, dedicatedVentilationRequired: true }];
    const r = buildReferenceAwareEngineeringReview({ ...baseReviewInput, rooms, referenceTraceByRoom: { "ROOM-1": validTrace }, appliedReferenceByRoom: { "ROOM-1": appliedReference }, engineeringByRoom: { "ROOM-1": finalInputs } });
    if (r.referenceChecks.find((x) => x.roomId === "ROOM-2")?.status !== "NOT_REQUIRED") throw new Error("unapplied second room should stay isolated");
  }),
  runCase("REFREV-007", "Base engineering review remains authoritative", () => {
    const r = buildReferenceAwareEngineeringReview({ ...baseReviewInput, rooms: [{ ...baseReviewInput.rooms[0], totalLoadKw: 0 }] });
    if (r.status !== "REVIEW_REQUIRED") throw new Error("base review failure should remain review required");
  }),
  runCase("REFREV-008", "Reference review does not mutate engineering inputs", () => {
    const before = JSON.stringify(finalInputs);
    buildReferenceAwareEngineeringReview({ ...baseReviewInput, referenceTraceByRoom: { "ROOM-1": validTrace }, appliedReferenceByRoom: { "ROOM-1": appliedReference }, engineeringByRoom: { "ROOM-1": finalInputs } });
    if (JSON.stringify(finalInputs) !== before) throw new Error("review must not mutate engineering inputs");
  }),
];
