import { buildReferenceDrivenInputs } from "../engineering/reference/referenceDrivenInputs.js";
import { applyReferenceToEngineeringInputs, buildReferenceResultTrace } from "../engineering/reference/referenceCalculationBridge.js";
import { buildReferenceTraceByRoom } from "../engineering/reference/referenceResultIntegration.js";

export const runReferenceTraceabilityHardeningTests = () => {
  const results = [];
  const check = (id, name, condition) => results.push({ id, name, passed: Boolean(condition) });

  const resolvedWall = buildReferenceDrivenInputs({
    locationId: "LAGOS_IKEJA",
    occupancyActivityId: "OFFICE_TYPING",
    ventilationId: "OFFICE_SPACE_62_1_2022",
    constructionId: "ASHRAE_90_1_CZ1_STEEL_FRAMED_WALL",
    fenestrationId: "ASHRAE_90_1_CZ1_VERTICAL_GLAZING_METAL",
  });
  const base = {
    wall: { uValueWm2K: 0.5, construction: "Project wall" },
    windows: { uValueWm2K: 2.8, shgc: 0.4, glazing: "Project glazing" },
  };
  const applied = applyReferenceToEngineeringInputs(base, resolvedWall);

  check("REFH-001", "Reference application does not mutate the original engineering inputs", base.wall.uValueWm2K === 0.5 && base.windows.uValueWm2K === 2.8);
  check("REFH-002", "Sourced wall and fenestration values are applied explicitly", applied.inputs.wall.uValueWm2K === 0.704 && applied.inputs.windows.uValueWm2K === 6.814 && applied.inputs.windows.shgc === 0.25);
  check("REFH-003", "Explicit application carries location, activity and ventilation provenance", Boolean(applied.referenceBasis.location?.sourceRef) && Boolean(applied.referenceBasis.occupantActivity?.sourceRef) && Boolean(applied.referenceBasis.ventilation?.sourceRef));
  check("REFH-004", "Benchmark references remain verification-required", applied.referenceBasis.construction?.benchmarkOnly === true && applied.referenceBasis.fenestration?.benchmarkOnly === true && applied.referenceBasis.verificationRequired === true);

  const nullResolved = buildReferenceDrivenInputs({ constructionId: "ENGINEER_DEFINED_MASONRY_WALL", fenestrationId: "ENGINEER_DEFINED_CLEAR_GLASS" });
  const nullApplied = applyReferenceToEngineeringInputs({ wall: { uValueWm2K: 0.7 }, windows: { uValueWm2K: 2.2, shgc: 0.35 } }, nullResolved);
  check("REFH-005", "Null reference values never overwrite engineer-defined values", nullApplied.inputs.wall.uValueWm2K === 0.7 && nullApplied.inputs.windows.uValueWm2K === 2.2 && nullApplied.inputs.windows.shgc === 0.35);

  const trace = buildReferenceResultTrace({ referenceBasis: applied.referenceBasis, referenceAppliedInputs: applied.inputs, finalInputs: applied.inputs });
  check("REFH-006", "Unchanged applied inputs produce no false engineer override", trace?.engineerOverrideWins === false && trace?.overriddenFields.length === 0);

  const overridden = { ...applied.inputs, wall: { ...applied.inputs.wall, uValueWm2K: 0.5 } };
  const overrideTrace = buildReferenceResultTrace({ referenceBasis: applied.referenceBasis, referenceAppliedInputs: applied.inputs, finalInputs: overridden });
  check("REFH-007", "Post-application engineer edits remain authoritative", overrideTrace?.engineerOverrideWins === true && overrideTrace?.overriddenFields.some((field) => field.label === "Wall U-value" && field.finalValue === 0.5));

  const roomTraces = buildReferenceTraceByRoom({
    roomIds: ["ROOM-1", "ROOM-2", "ROOM-3"],
    engineeringByRoom: { "ROOM-1": applied.inputs, "ROOM-2": applied.inputs, "ROOM-3": applied.inputs },
    appliedReferenceByRoom: { "ROOM-1": applied },
  });
  check("REFH-008", "Only explicitly applied rooms receive reference provenance", roomTraces["ROOM-1"]?.explicitApplication === true && roomTraces["ROOM-2"] === null && roomTraces["ROOM-3"] === null);

  const traceCopy = buildReferenceResultTrace({ referenceBasis: applied.referenceBasis, referenceAppliedInputs: applied.inputs, finalInputs: applied.inputs });
  traceCopy.referenceBasis.datasetVersion = "MUTATED";
  check("REFH-009", "Trace output is isolated from the source reference basis", trace.referenceBasis.datasetVersion === "1.1.0");

  check("REFH-010", "Trace remains absent without an explicit applied reference", buildReferenceTraceByRoom({ roomIds: ["ROOM-1"], engineeringByRoom: { "ROOM-1": base }, appliedReferenceByRoom: {} })["ROOM-1"] === null);

  return results;
};
