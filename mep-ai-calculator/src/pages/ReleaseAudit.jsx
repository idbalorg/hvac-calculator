import { useMemo } from "react";
import { deserializeReleaseAudit } from "../engineering/report/releaseAudit.js";

export default function ReleaseAudit() {
  const key = useMemo(() => { try { const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]"); return projects.at(-1)?.id || projects.at(-1)?.projectId || "current"; } catch { return "current"; } }, []);
  const events = useMemo(() => { try { const raw = localStorage.getItem(`hvac-release-audit-${key}`); return raw ? deserializeReleaseAudit(raw).events.slice().reverse() : []; } catch { return []; } }, [key]);
  return <div className="card"><div className="section-heading"><h3>Release Audit Trail</h3><span>STAGE 26</span></div><div className="table-wrap"><table><thead><tr><th>Event</th><th>Release</th><th>Revision</th><th>Actor</th><th>Timestamp</th><th>Evidence</th><th>Production SHA</th></tr></thead><tbody>{events.length ? events.map((e) => <tr key={e.eventId}><td><b>{e.eventType}</b></td><td>{e.releaseId}</td><td>{e.revisionId}</td><td>{e.actor}</td><td>{e.timestamp}</td><td>{e.evidenceReference || "N/A"}</td><td>{e.productionCommitSHA || "N/A"}</td></tr>) : <tr><td colSpan="7">No release audit events recorded yet.</td></tr>}</tbody></table></div><p className="engineering-note"><b>Audit boundary:</b> Release events are traceability records. They do not certify code compliance or replace engineering approval.</p></div>;
}
