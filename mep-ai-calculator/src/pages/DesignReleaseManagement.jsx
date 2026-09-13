import { useMemo, useState } from "react";
import { createReleaseHistory, createReleaseCandidate, releaseBaseline, attachRevisionSnapshotToCandidate, getReleasedBaseline, getReleaseHistorySummary, deserializeReleaseHistory } from "../engineering/report/releaseControl.js";
import { createReleaseAudit, recordReleaseAuditEvent, recordProductionPromotion, deserializeReleaseAudit } from "../engineering/report/releaseAudit.js";
import { deserializeRevisionHistory, getCurrentRevision } from "../engineering/report/revisionControl.js";
import "../App.css";

const field = (value) => String(value || "").trim();

export default function DesignReleaseManagement() {
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem("hvac-projects") || "[]").at(-1) || null; } catch { return null; } }, []);
  const key = saved?.id || saved?.projectId || "current";
  const revisionHistory = useMemo(() => { try { const raw = localStorage.getItem(`hvac-revision-history-${key}`); return raw ? deserializeRevisionHistory(raw) : null; } catch { return null; } }, [key]);
  const [releaseHistory, setReleaseHistory] = useState(() => { try { const raw = localStorage.getItem(`hvac-release-history-${key}`); return raw ? deserializeReleaseHistory(raw) : createReleaseHistory(); } catch { return createReleaseHistory(); } });
  const [auditHistory, setAuditHistory] = useState(() => { try { const raw = localStorage.getItem(`hvac-release-audit-${key}`); return raw ? deserializeReleaseAudit(raw) : createReleaseAudit(); } catch { return createReleaseAudit(); } });
  const [releaseVersion, setReleaseVersion] = useState("1.0.0");
  const [createdBy, setCreatedBy] = useState("");
  const [candidateReason, setCandidateReason] = useState("Approved design package ready for production release");
  const [releaseId, setReleaseId] = useState("");
  const [releasedBy, setReleasedBy] = useState("");
  const [releaseReason, setReleaseReason] = useState("");
  const [releaseEvidence, setReleaseEvidence] = useState("");
  const [productionCommitSHA, setProductionCommitSHA] = useState("");
  const [promotionBy, setPromotionBy] = useState("");
  const [promotionEvidence, setPromotionEvidence] = useState("");
  const [error, setError] = useState("");
  const currentRevision = getCurrentRevision(revisionHistory);
  const summary = getReleaseHistorySummary(releaseHistory);
  const candidate = releaseHistory.releases.find((item) => item.releaseId === releaseId) || releaseHistory.releases.find((item) => item.status === "RELEASE_CANDIDATE");
  const releasedBaseline = getReleasedBaseline(releaseHistory);
  const persist = (next) => { setReleaseHistory(next); localStorage.setItem(`hvac-release-history-${key}`, JSON.stringify(next)); };
  const persistAudit = (next) => { setAuditHistory(next); localStorage.setItem(`hvac-release-audit-${key}`, JSON.stringify(next)); };

  const createCandidate = () => {
    setError("");
    try {
      if (!currentRevision) throw new Error("Create a design revision first in Final Package.");
      const now = new Date().toISOString();
      const next = createReleaseCandidate({ revisionHistory, releaseHistory, revisionId: currentRevision.revisionId, releaseVersion: field(releaseVersion), createdBy: field(createdBy), createdAt: now, reason: field(candidateReason), evidenceReference: "Engineering approval record" });
      const withSnapshot = attachRevisionSnapshotToCandidate({ releaseHistory: next, releaseId: next.currentReleaseId, revisionSnapshot: currentRevision.packageSnapshot });
      persist(withSnapshot);
      setReleaseId(withSnapshot.currentReleaseId);
      const audit = recordReleaseAuditEvent({ auditHistory, eventType: "RELEASE_CANDIDATE_CREATED", releaseId: withSnapshot.currentReleaseId, revisionId: currentRevision.revisionId, actor: field(createdBy), timestamp: now, evidenceReference: "Engineering approval record", message: "Release candidate created from approved revision" });
      persistAudit(audit);
    } catch (e) { setError(e.message || "Unable to create release candidate."); }
  };

  const release = () => {
    setError("");
    try {
      const target = candidate;
      if (!target) throw new Error("Create a release candidate first.");
      const now = new Date().toISOString();
      const next = releaseBaseline({ releaseHistory, releaseId: target.releaseId, releasedBy: field(releasedBy), releasedAt: now, releaseReason: field(releaseReason), releaseEvidenceReference: field(releaseEvidence), productionCommitSHA: field(productionCommitSHA) });
      persist(next);
      const audit = recordReleaseAuditEvent({ auditHistory, eventType: "RELEASED", releaseId: target.releaseId, revisionId: target.revisionId, actor: field(releasedBy), timestamp: now, evidenceReference: field(releaseEvidence), productionCommitSHA: field(productionCommitSHA), message: "Immutable production baseline released" });
      persistAudit(audit);
    } catch (e) { setError(e.message || "Unable to release baseline."); }
  };

  const promote = () => {
    setError("");
    try {
      if (!releasedBaseline) throw new Error("Release an immutable baseline before recording production promotion.");
      const now = new Date().toISOString();
      const audit = recordProductionPromotion({ releaseHistory, releaseId: releasedBaseline.releaseId, productionCommitSHA: field(productionCommitSHA), actor: field(promotionBy), timestamp: now, evidenceReference: field(promotionEvidence), auditHistory });
      persistAudit(audit);
    } catch (e) {
      const target = releasedBaseline;
      if (target && field(promotionBy) && field(promotionEvidence)) {
        try { persistAudit(recordReleaseAuditEvent({ auditHistory, eventType: "PROMOTION_REJECTED", releaseId: target.releaseId, revisionId: target.revisionId, actor: field(promotionBy), timestamp: new Date().toISOString(), evidenceReference: field(promotionEvidence), productionCommitSHA: field(productionCommitSHA), message: e.message || "Production promotion rejected" })); } catch {}
      }
      setError(e.message || "Unable to record production promotion.");
    }
  };

  const exportJson = () => { const blob = new Blob([JSON.stringify({ releaseHistory, auditHistory }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${saved?.name || "hvac-project"}-release-audit.json`; anchor.click(); URL.revokeObjectURL(url); };

  return <div className="container">
    <div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 26</p><h1 className="title">Design Release & Promotion Control</h1><p className="subtitle">Record the release baseline and production promotion without automatically modifying the GitHub production branch.</p></div><span className="version-badge">Release Audit 1.0</span></div>
    <div className="card"><div className="section-heading"><h3>Release Status</h3><span>01</span></div><div className="stat-grid"><div className="stat"><span>Current revision</span><b>{currentRevision?.revisionId || "Not created"}</b></div><div className="stat"><span>Revision status</span><b>{currentRevision?.status || "N/A"}</b></div><div className="stat"><span>Current release</span><b>{summary.currentReleaseId || "None"}</b></div><div className="stat"><span>Release status</span><b>{summary.currentStatus || "NONE"}</b></div><div className="stat"><span>Audit events</span><b>{auditHistory.events.length}</b></div><div className="stat"><span>Released baselines</span><b>{summary.releasedCount}</b></div></div>{releasedBaseline && <p className="engineering-note"><b>Production baseline:</b> {releasedBaseline.releaseId} · {releasedBaseline.releaseVersion} · revision {releasedBaseline.revisionId} · commit {releasedBaseline.productionCommitSHA}</p>}</div>
    <div className="card no-print"><div className="section-heading"><h3>Create Release Candidate</h3><span>02</span></div><p className="form-note">A release candidate can only be created from the current revision after explicit engineering approval. This action creates a traceability event.</p><div className="input-grid"><Input label="Release version" value={releaseVersion} onChange={setReleaseVersion} /><InputText label="Prepared by" value={createdBy} onChange={setCreatedBy} /><InputText label="Release reason" value={candidateReason} onChange={setCandidateReason} /></div><button onClick={createCandidate}>Create Release Candidate</button></div>
    <div className="card no-print"><div className="section-heading"><h3>Release Production Baseline</h3><span>03</span></div><p className="form-note">Records an immutable released baseline and the production commit SHA representing that baseline. It does not push or modify GitHub.</p><div className="input-grid"><InputText label="Release ID" value={releaseId || candidate?.releaseId || ""} onChange={setReleaseId} /><InputText label="Released by" value={releasedBy} onChange={setReleasedBy} /><InputText label="Release reason" value={releaseReason} onChange={setReleaseReason} /><InputText label="Evidence / reference" value={releaseEvidence} onChange={setReleaseEvidence} /><InputText label="Production commit SHA" value={productionCommitSHA} onChange={setProductionCommitSHA} /></div>{error && <p className="error-message">{error}</p>}<button onClick={release} disabled={!candidate}>Release Immutable Baseline</button></div>
    <div className="card no-print"><div className="section-heading"><h3>Record Production Promotion</h3><span>04</span></div><p className="form-note">Record promotion only after the production branch has been explicitly updated outside this workflow. The commit SHA must exactly match the released baseline.</p><div className="input-grid"><InputText label="Promotion actor" value={promotionBy} onChange={setPromotionBy} /><InputText label="Promotion evidence / reference" value={promotionEvidence} onChange={setPromotionEvidence} /><InputText label="Production commit SHA" value={productionCommitSHA} onChange={setProductionCommitSHA} /></div><button onClick={promote} disabled={!releasedBaseline}>Record Production Promotion</button>{summary.currentReleaseId && <button className="secondary-button" onClick={exportJson}>Export Release & Audit History</button>}</div>
    <div className="card"><div className="section-heading"><h3>Release Register</h3><span>05</span></div><div className="table-wrap"><table><thead><tr><th>Release</th><th>Version</th><th>Revision</th><th>Status</th><th>Prepared by</th><th>Released by</th><th>Production SHA</th></tr></thead><tbody>{releaseHistory.releases.length ? releaseHistory.releases.slice().reverse().map((item) => <tr key={item.releaseId}><td><b>{item.releaseId}</b></td><td>{item.releaseVersion}</td><td>{item.revisionId}</td><td>{item.status}</td><td>{item.createdBy}</td><td>{item.releasedBy || "Pending"}</td><td>{item.productionCommitSHA || "Pending"}</td></tr>) : <tr><td colSpan="7">No release record yet.</td></tr>}</tbody></table></div><p className="engineering-note"><b>Release-control boundary:</b> A RELEASED baseline is immutable. Design changes require a new revision, fresh approval, a new release candidate and a new release baseline.</p></div>
  </div>;
}

function Input({ label, value, onChange }) { return <label className="field"><span>{label}</span><input type="text" value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function InputText({ label, value, onChange }) { return <label className="field"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
