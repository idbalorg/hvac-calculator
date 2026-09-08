import { buildDesignReport } from "./designReport.js";
import { buildStandardsTraceability } from "../standards/standardsTraceability.js";
import { buildResultTraceability } from "./resultTraceability.js";
import { buildEngineeringReview } from "../review/engineeringReview.js";
import { buildEngineeringDecision } from "../review/engineeringDecision.js";
import { buildEngineeringApproval } from "../review/engineeringApproval.js";

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const normalizeRoom = (room, load, airside) => {
  const rawLoad = load?.rawLoad ?? load;
  const designLoad = load?.designLoad ?? load;
  const sensibleW = n(rawLoad?.sensibleW ?? load?.sensibleLoadW);
  const totalW = n(rawLoad?.totalW ?? load?.totalLoadW);

  return {
    roomId: room.roomId ?? room.id,
    roomName: room.roomName ?? room.name ?? room.id,
    areaM2: n(room.areaM2, n(room.area)),
    sensibleLoadKw: sensibleW / 1000,
    latentLoadKw: n(rawLoad?.latentW ?? load?.latentLoadW) / 1000,
    totalLoadKw: n(designLoad?.totalW ?? load?.designLoadW ?? load?.totalLoadW) / 1000,
    sensibleHeatRatio: n(rawLoad?.sensibleHeatRatio, totalW > 0 ? sensibleW / totalW : 0),
    supplyAirflowCfm: n(airside?.airflow?.airflowM3s) * 2118.88,
    terminalCount: n(airside?.terminalCount, 1),
    outdoorAirflowCfm: n(airside?.outdoorAirflowCfm ?? airside?.ventilation?.outdoorAirflowCfm ?? room.outdoorAirflowCfm),
    dedicatedVentilationRequired: room.dedicatedVentilationRequired === true,
  };
};

export const buildFinalDesignPackage = ({
  project,
  rooms,
  loadResults,
  airsideResults,
  equipment,
  ducts,
  systemSummary = null,
  criteria = {},
  approval = null,
  generatedAt = null,
}) => {
  if (!project || typeof project !== "object") throw new Error("project is required");
  if (!Array.isArray(rooms) || rooms.length === 0) throw new Error("rooms must contain at least one room");
  if (!Array.isArray(loadResults) || loadResults.length === 0) throw new Error("loadResults must contain at least one result");
  if (!Array.isArray(airsideResults) || airsideResults.length === 0) throw new Error("airsideResults must contain at least one result");

  const normalizedRooms = rooms.map((room) => {
    const roomId = room.roomId ?? room.id;
    return normalizeRoom(
      room,
      loadResults.find((item) => item.roomId === roomId),
      airsideResults.find((item) => item.roomId === roomId),
    );
  });

  const normalizedEquipment = equipment || [];
  const normalizedDucts = ducts || [];
  const reportCriteria = {
    minimumCapacityMarginPercent: 0,
    maximumCapacityOversizePercent: null,
    minimumAirflowRatio: 1,
    minimumEspRatio: 1,
    ...criteria,
  };

  const report = buildDesignReport({ project, rooms: normalizedRooms, equipment: normalizedEquipment, ducts: normalizedDucts, systemSummary, criteria: reportCriteria, generatedAt });
  const standardsTraceability = buildStandardsTraceability({ rooms: normalizedRooms, equipment: normalizedEquipment, ducts: normalizedDucts, projectCriteria: criteria, systemSummary });
  const resultTraceability = buildResultTraceability({ rooms: normalizedRooms, equipment: normalizedEquipment, ducts: normalizedDucts, systemSummary });
  const engineeringReview = buildEngineeringReview({ rooms: normalizedRooms, equipment: normalizedEquipment, ducts: normalizedDucts, systemSummary, criteria });
  const engineeringDecision = buildEngineeringDecision({ engineeringReview });
  const engineeringApproval = buildEngineeringApproval({ engineeringDecision, approval });

  return {
    packageVersion: "22.0.0",
    generatedAt,
    report,
    standardsTraceability,
    resultTraceability,
    engineeringReview,
    engineeringDecision,
    engineeringApproval,
    readiness: {
      reportGenerated: true,
      validationPassed: report.validation.passed,
      engineeringReviewPassed: engineeringReview.status === "PASS",
      engineeringDecisionStatus: engineeringDecision.status,
      engineeringApprovalStatus: engineeringApproval.status,
      readinessScore: engineeringDecision.readinessScore,
      verificationRequired: true,
      constructionReady: false,
    },
  };
};

export const summarizeFinalDesignPackage = (designPackage) => {
  if (!designPackage?.report?.summary) throw new Error("A final design package is required");
  const { summary, validation } = designPackage.report;
  return {
    packageVersion: designPackage.packageVersion,
    validationPassed: validation.passed,
    engineeringReviewStatus: designPackage.engineeringReview?.status || "REVIEW_REQUIRED",
    engineeringDecisionStatus: designPackage.engineeringDecision?.status || "REVIEW_REQUIRED",
    engineeringApprovalStatus: designPackage.engineeringApproval?.status || "PENDING",
    readinessScore: designPackage.engineeringDecision?.readinessScore ?? 0,
    exceptionCount: designPackage.engineeringDecision?.summary?.exceptionCount ?? 0,
    unresolvedExceptionCount: designPackage.engineeringApproval?.summary?.unresolved ?? designPackage.engineeringDecision?.summary?.exceptionCount ?? 0,
    roomCount: summary.roomCount,
    equipmentCount: summary.equipmentCount,
    ductCount: summary.ductCount,
    totalCoolingLoadKw: summary.totalCoolingLoadKw,
    totalSupplyAirflowCfm: summary.totalSupplyAirflowCfm,
    totalInstalledCapacityKw: summary.totalInstalledCapacityKw,
    verificationRequired: designPackage.readiness.verificationRequired,
    constructionReady: designPackage.readiness.constructionReady,
  };
};
