import { buildDesignReport } from "./designReport.js";

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const normalizeRoom = (room, load, airside) => ({
  roomId: room.roomId ?? room.id,
  roomName: room.roomName ?? room.name ?? room.id,
  areaM2: n(room.areaM2, n(room.area)),
  sensibleLoadKw: n(load?.sensibleLoadW) / 1000,
  latentLoadKw: n(load?.latentLoadW) / 1000,
  totalLoadKw: n(load?.designLoadW ?? load?.totalLoadW) / 1000,
  supplyAirflowCfm: n(airside?.airflow?.airflowM3s) * 2118.88,
  terminalCount: n(airside?.terminalCount, 1),
});

export const buildFinalDesignPackage = ({
  project,
  rooms,
  loadResults,
  airsideResults,
  equipment,
  ducts,
  systemSummary = null,
  criteria = {},
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

  const report = buildDesignReport({
    project,
    rooms: normalizedRooms,
    equipment,
    ducts,
    systemSummary,
    criteria: {
      minimumCapacityMarginPercent: 0,
      maximumCapacityOversizePercent: null,
      minimumAirflowRatio: 1,
      minimumEspRatio: 1,
      ...criteria,
    },
    generatedAt,
  });

  return {
    packageVersion: "17.0.0",
    generatedAt,
    report,
    readiness: {
      reportGenerated: true,
      validationPassed: report.validation.passed,
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
