const REVISION_SCHEMA_VERSION = "1.0";
export const REVISION_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED", "SUPERSEDED"];

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

const clone = (value) => JSON.parse(JSON.stringify(value));

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
};

const requireMeta = ({ changedBy, changedAt, reason }) => {
  if (!hasText(changedBy)) throw new Error("changedBy is required");
  if (!hasText(changedAt)) throw new Error("changedAt is required");
  if (!hasText(reason)) throw new Error("change reason is required");
};

const normalizeAffected = (affected = {}) => ({
  rooms: Array.isArray(affected.rooms) ? [...new Set(affected.rooms)] : [],
  calculations: Array.isArray(affected.calculations) ? [...new Set(affected.calculations)] : [],
  equipment: Array.isArray(affected.equipment) ? [...new Set(affected.equipment)] : [],
  ducts: Array.isArray(affected.ducts) ? [...new Set(affected.ducts)] : [],
  other: Array.isArray(affected.other) ? [...new Set(affected.other)] : [],
});

const invalidateApproval = (approval = null, reason = "Design revision created") => ({
  status: "PENDING",
  approved: false,
  canApprove: false,
  approver: null,
  reason: null,
  evidenceReference: null,
  timestamp: null,
  overrides: [],
  unresolvedExceptions: approval?.unresolvedExceptions || [],
  invalidated: true,
  invalidationReason: reason,
  previousApprovalStatus: approval?.status || "PENDING",
});

const makeRevisionId = (number) => `REV-${String(number).padStart(3, "0")}`;

const immutableSnapshot = (packageData) => deepFreeze(clone(packageData));

export const createRevisionHistory = ({ packageData, changedBy, changedAt, reason = "Initial design package" }) => {
  if (!packageData || typeof packageData !== "object") throw new Error("packageData is required");
  requireMeta({ changedBy, changedAt, reason });
  const revision = {
    revisionId: makeRevisionId(1),
    revisionNumber: 1,
    status: "DRAFT",
    createdAt: changedAt,
    createdBy: changedBy,
    changeReason: reason,
    affected: normalizeAffected(),
    approvalInvalidated: false,
    packageSnapshot: immutableSnapshot(packageData),
  };
  return {
    schemaVersion: REVISION_SCHEMA_VERSION,
    currentRevisionId: revision.revisionId,
    revisions: [revision],
  };
};

export const createRevision = ({ history, packageData, changedBy, changedAt, reason, affected = {} }) => {
  if (!history || !Array.isArray(history.revisions) || history.revisions.length === 0) throw new Error("revision history is required");
  if (!packageData || typeof packageData !== "object") throw new Error("packageData is required");
  requireMeta({ changedBy, changedAt, reason });

  const previous = history.revisions.find((item) => item.revisionId === history.currentRevisionId) || history.revisions.at(-1);
  const nextNumber = Math.max(...history.revisions.map((item) => Number(item.revisionNumber) || 0)) + 1;
  const nextId = makeRevisionId(nextNumber);
  const wasApproved = previous?.status === "APPROVED" || previous?.packageSnapshot?.engineeringApproval?.approved === true;

  const revisions = history.revisions.map((item) => (
    item.revisionId === previous?.revisionId && wasApproved
      ? { ...item, status: "SUPERSEDED", supersededAt: changedAt, supersededBy: nextId }
      : item
  ));

  const nextPackage = clone(packageData);
  if (wasApproved || nextPackage.engineeringApproval?.approved) {
    nextPackage.engineeringApproval = invalidateApproval(nextPackage.engineeringApproval, `Approval invalidated by ${nextId}: ${reason}`);
    if (nextPackage.readiness) {
      nextPackage.readiness.engineeringApprovalStatus = "PENDING";
    }
  }

  const revision = {
    revisionId: nextId,
    revisionNumber: nextNumber,
    status: "DRAFT",
    createdAt: changedAt,
    createdBy: changedBy,
    changeReason: reason,
    affected: normalizeAffected(affected),
    approvalInvalidated: wasApproved || Boolean(packageData.engineeringApproval?.approved),
    previousRevisionId: previous?.revisionId || null,
    packageSnapshot: immutableSnapshot(nextPackage),
  };

  return {
    schemaVersion: REVISION_SCHEMA_VERSION,
    currentRevisionId: nextId,
    revisions: [...revisions, revision],
  };
};

export const updateRevisionStatus = ({ history, revisionId, status }) => {
  if (!REVISION_STATUSES.includes(status)) throw new Error(`Unsupported revision status: ${status}`);
  if (!history?.revisions?.some((item) => item.revisionId === revisionId)) throw new Error("revisionId was not found");
  return {
    ...history,
    revisions: history.revisions.map((item) => item.revisionId === revisionId ? { ...item, status } : item),
  };
};

export const getCurrentRevision = (history) => history?.revisions?.find((item) => item.revisionId === history.currentRevisionId) || null;

export const getRevisionHistorySummary = (history) => ({
  schemaVersion: history?.schemaVersion || REVISION_SCHEMA_VERSION,
  currentRevisionId: history?.currentRevisionId || null,
  revisionCount: history?.revisions?.length || 0,
  currentStatus: getCurrentRevision(history)?.status || null,
  approvedRevisionCount: history?.revisions?.filter((item) => item.status === "APPROVED").length || 0,
  supersededRevisionCount: history?.revisions?.filter((item) => item.status === "SUPERSEDED").length || 0,
});

export const serializeRevisionHistory = (history) => JSON.stringify(history);
export const deserializeRevisionHistory = (value) => {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!parsed || !Array.isArray(parsed.revisions)) throw new Error("Invalid revision history");
  return parsed;
};
