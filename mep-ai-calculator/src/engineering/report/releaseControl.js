const RELEASE_SCHEMA_VERSION = "1.0";
export const RELEASE_STATUSES = ["RELEASE_CANDIDATE", "RELEASED", "SUPERSEDED"];
const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const clone = (value) => JSON.parse(JSON.stringify(value));
const deepFreeze = (value) => { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); Object.values(value).forEach(deepFreeze); return value; };
const immutableSnapshot = (value) => deepFreeze(clone(value));
const requireText = (value, name) => { if (!hasText(value)) throw new Error(`${name} is required`); };
const makeReleaseId = (number) => `REL-${String(number).padStart(3, "0")}`;

export const createReleaseHistory = ({ history = null } = {}) => history && Array.isArray(history.releases)
  ? history
  : { schemaVersion: RELEASE_SCHEMA_VERSION, currentReleaseId: null, releases: [] };

export const createReleaseCandidate = ({ revisionHistory, releaseHistory = null, revisionId, releaseVersion, createdBy, createdAt, reason, evidenceReference = "" }) => {
  requireText(revisionId, "revisionId");
  requireText(releaseVersion, "releaseVersion");
  requireText(createdBy, "createdBy");
  requireText(createdAt, "createdAt");
  requireText(reason, "release reason");
  const revision = revisionHistory?.revisions?.find((item) => item.revisionId === revisionId);
  if (!revision) throw new Error("revisionId was not found");
  if (revision.status !== "APPROVED" || revision.approvalSnapshot?.approved !== true) throw new Error("Only an approved revision can become a release candidate");
  const history = createReleaseHistory({ history: releaseHistory });
  const existing = history.releases.find((item) => item.revisionId === revisionId && item.status === "RELEASE_CANDIDATE");
  if (existing) throw new Error(`${revisionId} already has a release candidate`);
  const nextNumber = Math.max(0, ...history.releases.map((item) => Number(item.releaseNumber) || 0)) + 1;
  const releaseId = makeReleaseId(nextNumber);
  const candidate = {
    releaseId,
    releaseNumber: nextNumber,
    releaseVersion: releaseVersion.trim(),
    revisionId,
    status: "RELEASE_CANDIDATE",
    createdBy: createdBy.trim(),
    createdAt,
    releaseReason: reason.trim(),
    releaseEvidenceReference: String(evidenceReference || "").trim(),
    releasedBy: null,
    releasedAt: null,
    productionCommitSHA: null,
    environment: "production",
    baselineSnapshot: null,
  };
  return { ...history, currentReleaseId: releaseId, releases: [...history.releases, candidate] };
};

export const releaseBaseline = ({ releaseHistory, releaseId, releasedBy, releasedAt, releaseReason, releaseEvidenceReference, productionCommitSHA }) => {
  if (!releaseHistory?.releases?.length) throw new Error("release history is required");
  requireText(releaseId, "releaseId");
  requireText(releasedBy, "releasedBy");
  requireText(releasedAt, "releasedAt");
  requireText(releaseReason, "release reason");
  requireText(releaseEvidenceReference, "release evidence/reference");
  requireText(productionCommitSHA, "productionCommitSHA");
  const candidate = releaseHistory.releases.find((item) => item.releaseId === releaseId);
  if (!candidate) throw new Error("releaseId was not found");
  if (candidate.status !== "RELEASE_CANDIDATE") throw new Error("Only a release candidate can be released");
  const released = {
    ...candidate,
    status: "RELEASED",
    releasedBy: releasedBy.trim(),
    releasedAt,
    releaseReason: releaseReason.trim(),
    releaseEvidenceReference: releaseEvidenceReference.trim(),
    productionCommitSHA: productionCommitSHA.trim(),
    environment: "production",
  };
  released.baselineSnapshot = immutableSnapshot({
    releaseId: released.releaseId,
    releaseVersion: released.releaseVersion,
    revisionId: released.revisionId,
    productionCommitSHA: released.productionCommitSHA,
    environment: released.environment,
    releasedBy: released.releasedBy,
    releasedAt: released.releasedAt,
    releaseReason: released.releaseReason,
    releaseEvidenceReference: released.releaseEvidenceReference,
    revisionSnapshot: candidate.baselineSnapshot || null,
  });
  return { ...releaseHistory, currentReleaseId: releaseId, releases: releaseHistory.releases.map((item) => item.releaseId === releaseId ? released : item) };
};

export const attachRevisionSnapshotToCandidate = ({ releaseHistory, releaseId, revisionSnapshot }) => {
  if (!releaseHistory?.releases?.some((item) => item.releaseId === releaseId)) throw new Error("releaseId was not found");
  const snapshot = immutableSnapshot(revisionSnapshot);
  return { ...releaseHistory, releases: releaseHistory.releases.map((item) => item.releaseId === releaseId ? { ...item, baselineSnapshot: snapshot } : item) };
};

export const supersedeReleasedBaselineForNewRevision = ({ releaseHistory, newRevisionId, changedAt }) => {
  requireText(newRevisionId, "newRevisionId");
  requireText(changedAt, "changedAt");
  return { ...releaseHistory, releases: releaseHistory.releases.map((item) => item.status === "RELEASED" && item.revisionId !== newRevisionId ? { ...item, status: "SUPERSEDED", supersededAt: changedAt, supersededByRevisionId: newRevisionId } : item) };
};

export const getCurrentRelease = (history) => history?.releases?.find((item) => item.releaseId === history.currentReleaseId) || null;
export const getReleasedBaseline = (history) => history?.releases?.filter((item) => item.status === "RELEASED").at(-1) || null;
export const getReleaseHistorySummary = (history) => ({ schemaVersion: history?.schemaVersion || RELEASE_SCHEMA_VERSION, currentReleaseId: history?.currentReleaseId || null, releaseCount: history?.releases?.length || 0, candidateCount: history?.releases?.filter((item) => item.status === "RELEASE_CANDIDATE").length || 0, releasedCount: history?.releases?.filter((item) => item.status === "RELEASED").length || 0, supersededCount: history?.releases?.filter((item) => item.status === "SUPERSEDED").length || 0, currentStatus: getCurrentRelease(history)?.status || null });
export const serializeReleaseHistory = (history) => JSON.stringify(history);
export const deserializeReleaseHistory = (value) => { const parsed = typeof value === "string" ? JSON.parse(value) : value; if (!parsed || !Array.isArray(parsed.releases)) throw new Error("Invalid release history"); return parsed; };
