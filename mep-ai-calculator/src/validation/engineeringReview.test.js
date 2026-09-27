import { buildEngineeringReview } from "../engineering/review/engineeringReview.js";

export const runEngineeringReviewTests = () => {
  const base = {
    rooms: [{ roomId: "R1", roomName: "Office", totalLoadKw: 5.5, supplyAirflowCfm: 424, outdoorAirflowCfm: 100, dedicatedVentilationRequired: true }],
    equipment: [{ equipmentId: "AC-01", manufacturer: "Daikin", model: "DX-6000", type: "SPLIT_DX", capacityKw: 6, requiredCapacityKw: 5.5, selectedAirflowCfm: 450, designAirflowCfm: 424, requiredEspPa: 0, selectedEspPa: 0, refrigerant: "R32" }],
    ducts: [],
    systemSummary: { status: "PASS", distributionType: "DIRECT_DISCHARGE" },
    criteria: {
      distributionType: "DIRECT_DISCHARGE",
      designConditionVerified: true,
      operatingConditionConfirmed: true,
      refrigerantPipingVerified: true,
      acousticCriteriaRequired: false,
    },
  };
  const tests = [];

  const good = buildEngineeringReview(base);
  if (good.status !== "PASS") throw new Error("Complete review should pass");
  tests.push({ id: "REV-001", name: "Complete direct-discharge review passes", passed: true });

  const missingWeather = buildEngineeringReview({ ...base, criteria: { ...base.criteria, designConditionVerified: false } });
  if (missingWeather.status !== "REVIEW_REQUIRED" || missingWeather.projectChecks.weatherDesignCondition.status !== "REVIEW_REQUIRED") throw new Error("Weather verification should require review");
  tests.push({ id: "REV-002", name: "Unverified design condition flagged", passed: true });

  const lowCapacity = buildEngineeringReview({ ...base, equipment: [{ ...base.equipment[0], capacityKw: 5 }] });
  if (lowCapacity.equipmentChecks[0].capacity.status !== "REVIEW_REQUIRED") throw new Error("Low capacity should require review");
  tests.push({ id: "REV-003", name: "Low equipment capacity flagged", passed: true });

  const ducted = buildEngineeringReview({ ...base, criteria: { ...base.criteria, distributionType: "DUCTED" }, systemSummary: { status: "PASS", distributionType: "DUCTED" }, ducts: [] });
  if (ducted.projectChecks.ductCompleteness.status !== "REVIEW_REQUIRED") throw new Error("Ducted system without ducts should require review");
  tests.push({ id: "REV-004", name: "Incomplete ducted design flagged", passed: true });

  const noRefrigerantVerification = buildEngineeringReview({ ...base, criteria: { ...base.criteria, refrigerantPipingVerified: false } });
  if (noRefrigerantVerification.projectChecks.refrigerantPiping.status !== "REVIEW_REQUIRED") throw new Error("DX refrigerant review should be required");
  tests.push({ id: "REV-005", name: "DX refrigerant/piping verification flagged", passed: true });

  const missingVentilation = buildEngineeringReview({ ...base, rooms: [{ ...base.rooms[0], outdoorAirflowCfm: 0 }] });
  if (missingVentilation.roomChecks[0].ventilation.status !== "REVIEW_REQUIRED") throw new Error("Missing required ventilation should be flagged");
  tests.push({ id: "REV-006", name: "Required ventilation completeness", passed: true });

  return tests;
};
