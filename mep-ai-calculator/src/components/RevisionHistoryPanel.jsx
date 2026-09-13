export default function RevisionHistoryPanel({ history, summary }) {
  const revisions = history?.revisions || [];
  return <div className="card print-section">
    <div className="section-heading"><h3>Engineering Revision & Change Control</h3><span>11</span></div>
    <div className="stat-grid">
      <div className="stat"><span>Current revision</span><b>{summary?.currentRevisionId || "Not created"}</b></div>
      <div className="stat"><span>Status</span><b>{summary?.currentStatus || "DRAFT"}</b></div>
      <div className="stat"><span>Total revisions</span><b>{summary?.revisionCount || 0}</b></div>
      <div className="stat"><span>Approved revisions</span><b>{summary?.approvedRevisionCount || 0}</b></div>
    </div>
    {revisions.length ? <div className="table-wrap"><table><thead><tr><th>Revision</th><th>Status</th><th>Changed by</th><th>Changed at</th><th>Reason</th><th>Affected scope</th></tr></thead><tbody>{revisions.slice().reverse().map((revision) => <tr key={revision.revisionId}><td><b>{revision.revisionId}</b></td><td>{revision.status}</td><td>{revision.createdBy}</td><td>{revision.createdAt}</td><td>{revision.changeReason}</td><td>{[
      ...(revision.affected?.rooms || []).map((item) => `Room:${item}`),
      ...(revision.affected?.calculations || []).map((item) => `Calc:${item}`),
      ...(revision.affected?.equipment || []).map((item) => `Equip:${item}`),
      ...(revision.affected?.ducts || []).map((item) => `Duct:${item}`),
    ].join(", ") || "Project-wide"}</td></tr>)}</tbody></table></div> : <p className="form-note">No revision has been created yet. Generate the first final design package to establish REV-001.</p>}
    <p className="engineering-note"><b>Change-control boundary:</b> An approved revision is never overwritten by a later design change. A new design revision supersedes the prior revision and forces engineering approval back to pending.</p>
  </div>;
}
