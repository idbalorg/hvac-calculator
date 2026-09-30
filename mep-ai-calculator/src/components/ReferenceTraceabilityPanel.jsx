import React from "react";

const valueOr = (value, fallback = "Not provided") => value === null || value === undefined || value === "" ? fallback : String(value);

export default function ReferenceTraceabilityPanel({ roomName, trace }) {
  if (!trace) {
    return <div className="reference-traceability"><strong>{roomName}</strong><p>Reference basis not explicitly applied. Current engineering inputs remain project/engineer defined.</p></div>;
  }

  const basis = trace.referenceBasis || {};
  const sourceRecords = [basis.location, basis.occupantActivity, basis.ventilation, basis.construction, basis.fenestration].filter(Boolean);
  const benchmarkOnly = sourceRecords.some((record) => record?.benchmarkOnly === true);
  const verificationRequired = trace.verificationRequired === true || sourceRecords.some((record) => record?.verificationRequired === true);

  return <section className="reference-traceability" aria-label={`Reference traceability for ${roomName}`}>
    <div className="section-heading compact"><h4>{roomName} · Reference Basis</h4><span>{trace.explicitApplication ? "Applied" : "Not Applied"}</span></div>
    <div className="stat"><span>Dataset version</span><b>{valueOr(basis.datasetVersion)}</b></div>
    <div className="stat"><span>Location</span><b>{valueOr(basis.location?.name || basis.location?.id)}</b></div>
    <div className="stat"><span>Occupant activity</span><b>{valueOr(basis.occupantActivity?.label || basis.occupantActivity?.id)}</b></div>
    <div className="stat"><span>Ventilation reference</span><b>{valueOr(basis.ventilation?.label || basis.ventilation?.id)}</b></div>
    <div className="stat"><span>Construction reference</span><b>{valueOr(basis.construction?.id)}</b></div>
    <div className="stat"><span>Fenestration reference</span><b>{valueOr(basis.fenestration?.id)}</b></div>
    <div className="stat"><span>Source references</span><b>{sourceRecords.map((record) => record?.sourceRef).filter(Boolean).join(" · ") || "None"}</b></div>
    <div className="stat"><span>Engineering status</span><b>{trace.engineerOverrideWins ? "Engineer override applied" : "Reference-applied values retained"}</b></div>
    <div className="stat"><span>Benchmark status</span><b>{benchmarkOnly ? "Benchmark only, not a Lagos default" : "No benchmark flag"}</b></div>
    <div className="stat"><span>Verification</span><b>{verificationRequired ? "Project-specific engineering verification required" : "Not flagged"}</b></div>
    {trace.overriddenFields?.length > 0 && <div className="trace-overrides"><strong>Engineer overrides</strong><ul>{trace.overriddenFields.map((field) => <li key={field.label}>{field.label}: reference {valueOr(field.referenceValue)} → final {valueOr(field.finalValue)}</li>)}</ul></div>}
  </section>;
}
