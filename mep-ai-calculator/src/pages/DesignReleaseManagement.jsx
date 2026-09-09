import { useMemo, useState } from "react";
import { createReleaseHistory, createReleaseCandidate, releaseBaseline, attachRevisionSnapshotToCandidate, getReleasedBaseline, getReleaseHistorySummary, deserializeReleaseHistory } from "../engineering/report/releaseControl.js";
import { deserializeRevisionHistory, getCurrentRevision } from "../engineering/report/revisionControl.js";
import "../App.css";

const field = (value) => String(value || "").trim();

export default function DesignReleaseManagement() {
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem("hvac-projects") || "[]").at(-1) || null; } catch { return null; } }, []);
  const key = saved?.id || saved?.projectId || "current";
  const revisionHistory = useMemo(() => { try { const raw = localStorage.getItem(`hvac-revision-history-${key}`); return raw ? deserializeRevisionHistory(raw) : null; } catch { return null; } }, [key]);
  const [releaseHistory, setReleaseHistory] = useState(() => { try { const raw = localStorage.getItem(`hvac-release-history-${key}`); return raw ? deserializeReleaseHistory(raw) : createReleaseHistory(); } catch { return createReleaseHistory(); } });
  const [releaseVersion, setReleaseVersion] = useState("1.0.0");
  const [createdBy, setCreatedBy] = useState("");
  const [candidateReason, setCandidateReason] = useState("Approved design package ready for production release");
  const [releaseId, setReleaseId] = useState("");
  const [releasedBy, setReleasedBy] = useState("");
  const [releaseReason, setReleaseReason] = useState("");
  const [releaseEvidence, setReleaseEvidence] = useState("");
  const [productionCommitSHA, setProductionCommitSHA] = useState("");
  const [error, setError] = useState("");
  const currentRevision = getCurrentRevision(revisionHistory);
  const summary = getReleaseHistorySummary(releaseHistory);
  const candidate = releaseHistory.releases.find((item) => item.releaseId === releaseId) || releaseHistory.releases.find((item) => item.status === "RELEASE_CANDIDATE");
  const persist = (next) => { setReleaseHistory(next); localStorage.setItem(`hvac-release-history-${key}`, JSON.stringify(next)); };

  const createCandidate = () => {
    setError("");
    try {
      if (!currentRevision) throw new Error("Create a design revision first in Final Package.");
      const next = createReleaseCandidate({ revisionHistory, releaseHistory, revisionId: currentRevision.revisionId, releaseVersion: field(releaseVersion), createdBy: field(createdBy), createdAt: new Date().toISOString(), reason: field(candidateReason), evidenceReference: "Engineering approval record" });
      const withSnapshot = attachRevisionSnapshotToCandidate({ releaseHistory: next, releaseId: next.currentReleaseId, revisionSnapshot: currentRevision.packageSnapshot });
      persist(withSnapshot);
      setReleaseId(withSnapshot.currentReleaseId);
    } catch (e) { setError(e.message || "Unable to create release candidate."); }
  };

  const release = () => {
    setError("");
    try {
      const target = candidate;
      if (!target) throw new Error("Create a release candidate first.");
      const next = releaseBaseline({ releaseHistory, releaseId: target.releaseId, releasedBy: field(releasedBy), releasedAt: new Date().toISOString(), releaseReason: field(releaseReason), releaseEvidenceReference: field(releaseEvidence), productionCommitSHA: field(productionCommitSHA) });
      persist(next);
    } catch (e) { setError(e.message || "Unable to release baseline."); }
  };

  const exportJson = () => { const blob = new Blob([JSON.stringify(releaseHistory, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${saved?.name || "hvac-project"}-release-history.json`; anchor.click(); URL.revokeObjectURL(url); };

  return <div className="container">
    <div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 25</p><h1 className="title">Design Package Release Management</h1><p className="subtitle">Separate an approved engineering revision from the immutable production baseline.</p></div><span className="version-badge">Release 1.0</span></div>
    <div className="card"><div className="section-heading"><h3>Release Status</h3><span>01</span></div><div className="stat-grid"><div className="stat"><span>Current revision</span><b>{currentRevision?.revisionId || "Not created"}</b></div><div className="stat"><span>Revision status</span><b>{currentRevision?.status || "N/A"}</b></div><div className="stat"><span>Current release</span><b>{summary.currentReleaseId || "None"}</b></div><div className="stat"><span>Release status</span><b>{summary.currentStatus || "NONE"}</b></div><div className="stat"><span>Released baselines</span><b>{summary.releasedCount}</b></div><div className="stat"><span>Release candidates</span><b>{summary.candidateCount}</b></div></div>{getReleasedBaseline(releaseHistory) && <p className="engineering-note"><b>Production baseline:</b> {getReleasedBaseline(releaseHistory).releaseId} · {getReleasedBaseline(releaseHistory).releaseVersion} · revision {getReleasedBaseline(releaseHistory).revisionId} · commit {getReleasedBaseline(releaseHistory).productionCommitSHA}</p>}</div>
    <div className="card no-print"><div className="section-heading"><h3>Create Release Candidate</h3><span>02</span></div><p className="form-note">A release candidate can only be created from the current revision after explicit engineering approval.</p><div className="input-grid"><Input label="Release version" value={releaseVersion} onChange={setReleaseVersion} /><InputText label="Prepared by" value={createdBy} onChange={setCreatedBy} /><InputText label="Release reason" value={candidateReason} onChange={setCandidateReason} /></div><button onClick={createCandidate}>Create Release Candidate</button></div>
    <div className="card no-print"><div className="section-heading"><h3>Release Production Baseline</h3><span>03</span></div><p className="form-note">This action records the production commit that represents the released design. It does not modify the GitHub production branch automatically.</p><div className="input-grid"><InputText label="Release ID" value={releaseId || candidate?.releaseId || ""} onChange={setReleaseId} /><InputText label="Released by" value={releasedBy} onChange={setReleasedBy} /><InputText label="Release reason" value={releaseReason} onChange={setReleaseReason} /><InputText label="Evidence / reference" value={releaseEvidence} onChange={setReleaseEvidence} /><InputText label="Production commit SHA" value={productionCommitSHA} onChange={setProductionCommitSHA} /></div>{error && <p className="error-message">{error}</p>}<button onClick={release} disabled={!candidate}>Release Immutable Baseline</button>{summary.currentReleaseId && <button className="secondary-button" onClick={exportJson}>Export Release History</button>}</div>
    <div className="card"><div className="section-heading"><h3>Release Register</h3><span>04</span></div><div className="table-wrap"><table><thead><tr><th>Release</th><th>Version</th><th>Revision</th><th>Status</th><th>Prepared by</th><th>Released by</th><th>Production SHA</th></tr></thead><tbody>{releaseHistory.releases.length ? releaseHistory.releases.slice().reverse().map((item) => <tr key={item.releaseId}><td><b>{item.releaseId}</b></td><td>{item.releaseVersion}</td><td>{item.revisionId}</td><td>{item.status}</td><td>{item.createdBy}</td><td>{item.releasedBy || "Pending"}</td><td>{item.productionCommitSHA || "Pending"}</td></tr>) : <tr><td colSpan="7">No release record yet.</td></tr>}</tbody></table></div><p className="engineering-note"><b>Release-control boundary:</b> A RELEASED baseline is immutable. Design changes must create a new revision, obtain fresh approval, and then create a new release candidate. Production is updated only through an explicit release action.</p></div>
  </div>;
}

function Input({ label, value, onChange }) { return <label className="field"><span>{label}</span><input type="number" value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function InputText({ label, value, onChange }) { return <label className="field"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
