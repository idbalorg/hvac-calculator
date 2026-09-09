import {
  createRevisionHistory,
  createRevision,
  updateRevisionStatus,
  getCurrentRevision,
  getRevisionHistorySummary,
  serializeRevisionHistory,
  deserializeRevisionHistory,
} from "../engineering/report/revisionControl.js";

const basePackage = {
  packageVersion: "22.0.0",
  engineeringApproval: { status: "PENDING", approved: false },
  readiness: { engineeringApprovalStatus: "PENDING", constructionReady: false },
};

export const runRevisionControlTests = () => [
  (() => {
    const history = createRevisionHistory({ packageData: basePackage, changedBy: "Engineer A", changedAt: "2026-09-09T08:00:00Z", reason: "Initial design package" });
    if (history.currentRevisionId !== "REV-001" || history.revisions.length !== 1) throw new Error("REV-001 failed");
    if (history.revisions[0].status !== "DRAFT" || history.revisions[0].changeReason !== "Initial design package") throw new Error("REV-001 metadata failed");
    return { id: "REV-001", name: "Initial revision is created with accountable metadata", passed: true };
  })(),
  (() => {
    const history = createRevisionHistory({ packageData: basePackage, changedBy: "Engineer A", changedAt: "2026-09-09T08:00:00Z" });
    const next = createRevision({ history, packageData: { ...basePackage, packageVersion: "24.0.0", engineeringApproval: { status: "APPROVED", approved: true } }, changedBy: "Engineer A", changedAt: "2026-09-09T09:00:00Z", reason: "Updated room load inputs", affected: { rooms: ["R1"], calculations: ["COOLING_LOAD"], equipment: ["AC-01"], ducts: ["D-01"] } });
    if (next.currentRevisionId !== "REV-002" || next.revisions.length !== 2) throw new Error("REV-002 creation failed");
    const previous = next.revisions.find((item) => item.revisionId === "REV-001");
    const current = getCurrentRevision(next);
    if (previous.status !== "SUPERSEDED" || current.status !== "DRAFT") throw new Error("Revision lifecycle failed");
    if (current.affected.rooms[0] !== "R1" || current.affected.calculations[0] !== "COOLING_LOAD") throw new Error("Affected scope failed");
    if (!current.approvalInvalidated || current.packageSnapshot.engineeringApproval.approved) throw new Error("Approval invalidation failed");
    if (current.packageSnapshot.readiness.engineeringApprovalStatus !== "PENDING") throw new Error("Readiness approval reset failed");
    if (!previous.packageSnapshot || previous.packageSnapshot.packageVersion !== "22.0.0") throw new Error("Historical snapshot was not preserved");
    return { id: "REV-002", name: "Design change creates a new revision and invalidates approval", passed: true };
  })(),
  (() => {
    const history = createRevisionHistory({ packageData: basePackage, changedBy: "Engineer A", changedAt: "2026-09-09T08:00:00Z" });
    const review = updateRevisionStatus({ history, revisionId: "REV-001", status: "IN_REVIEW" });
    if (getCurrentRevision(review).status !== "IN_REVIEW") throw new Error("REV-003 status transition failed");
    const approved = updateRevisionStatus({ history: review, revisionId: "REV-001", status: "APPROVED" });
    if (getCurrentRevision(approved).status !== "APPROVED") throw new Error("REV-003 approval status failed");
    return { id: "REV-003", name: "Revision lifecycle supports review and approval states", passed: true };
  })(),
  (() => {
    const history = createRevisionHistory({ packageData: basePackage, changedBy: "Engineer A", changedAt: "2026-09-09T08:00:00Z" });
    const summary = getRevisionHistorySummary(history);
    if (summary.revisionCount !== 1 || summary.currentRevisionId !== "REV-001" || summary.currentStatus !== "DRAFT") throw new Error("REV-004 summary failed");
    return { id: "REV-004", name: "Revision history summary is traceable", passed: true };
  })(),
  (() => {
    const history = createRevisionHistory({ packageData: basePackage, changedBy: "Engineer A", changedAt: "2026-09-09T08:00:00Z" });
    const restored = deserializeRevisionHistory(serializeRevisionHistory(history));
    if (restored.currentRevisionId !== history.currentRevisionId || restored.revisions.length !== 1) throw new Error("REV-005 serialization failed");
    return { id: "REV-005", name: "Revision history can be serialized and restored", passed: true };
  })(),
  (() => {
    let failed = false;
    try { createRevisionHistory({ packageData: basePackage, changedBy: "", changedAt: "2026-09-09T08:00:00Z" }); } catch { failed = true; }
    if (!failed) throw new Error("REV-006 missing metadata was accepted");
    return { id: "REV-006", name: "Revision creation requires accountable change metadata", passed: true };
  })(),
];
