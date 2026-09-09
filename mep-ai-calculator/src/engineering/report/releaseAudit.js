const AUDIT_SCHEMA_VERSION = "1.0";
const hasText = (v) => typeof v === "string" && v.trim().length > 0;
const clone = (v) => JSON.parse(JSON.stringify(v));
const requireText = (v, name) => { if (!hasText(v)) throw new Error(`${name} is required`); };

export const AUDIT_EVENTS = ["RELEASE_CANDIDATE_CREATED", "RELEASED", "PROMOTION_RECORDED", "PROMOTION_REJECTED", "BASELINE_SUPERSEDED"];

export const createReleaseAudit = ({ history = null } = {}) => history && Array.isArray(history.events)
  ? history
  : { schemaVersion: AUDIT_SCHEMA_VERSION, events: [] };

export const recordReleaseAuditEvent = ({ auditHistory = null, eventType, releaseId, revisionId, actor, timestamp, message = "", evidenceReference = "", productionCommitSHA = "", environment = "production" }) => {
  requireText(eventType, "eventType");
  if (!AUDIT_EVENTS.includes(eventType)) throw new Error("Unsupported release audit event");
  requireText(releaseId, "releaseId");
  requireText(revisionId, "revisionId");
  requireText(actor, "actor");
  requireText(timestamp, "timestamp");
  const history = createReleaseAudit({ history: auditHistory });
  const event = { eventId: `AUDIT-${String(history.events.length + 1).padStart(4, "0")}`, eventType, releaseId, revisionId, actor: actor.trim(), timestamp, message: String(message || "").trim(), evidenceReference: String(evidenceReference || "").trim(), productionCommitSHA: String(productionCommitSHA || "").trim(), environment };
  return { ...history, events: [...history.events, clone(event)] };
};

export const serializeReleaseAudit = (history) => JSON.stringify(history);
export const deserializeReleaseAudit = (value) => { const parsed = typeof value === "string" ? JSON.parse(value) : value; if (!parsed || !Array.isArray(parsed.events)) throw new Error("Invalid release audit history"); return parsed; };
export const getReleaseAuditFor = (history, releaseId) => (history?.events || []).filter((event) => event.releaseId === releaseId);
