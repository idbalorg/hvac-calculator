import { getDefaultDistributionType, resolveAirDistributionContext } from "../engineering/airside/airDistributionContext.js";

export const runAirDistributionContextTests = () => [
  { id: "DISTCTX-001", name: "Split DX defaults to direct discharge", passed: getDefaultDistributionType("SPLIT_DX") === "DIRECT_DISCHARGE" },
  { id: "DISTCTX-002", name: "Ducted split requires ducted distribution", passed: getDefaultDistributionType("DUCTED_SPLIT") === "DUCTED" },
  { id: "DISTCTX-003", name: "Chilled water supports ducted distribution", passed: resolveAirDistributionContext({ systemType: "CHILLED_WATER", distributionType: "DUCTED" }).ductRequired === true },
  { id: "DISTCTX-004", name: "Direct discharge skips duct design", passed: resolveAirDistributionContext({ systemType: "VRF", distributionType: "DIRECT_DISCHARGE" }).ductRequired === false },
  { id: "DISTCTX-005", name: "Ducted context identifies Stage 13 airflow source", passed: resolveAirDistributionContext({ systemType: "CHILLED_WATER", distributionType: "DUCTED" }).airflowSource === "STAGE_13_AIRSIDE" },
];
