import { useMemo, useState } from "react";
import "../App.css";
import { calculateCommissioningChecks, buildCommissioningChecklist, buildCommissioningHandover } from "../engineering/airside/systemCommissioning.js";

const n = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

export default function SystemCommissioning() {
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem("hvac-projects") || "[]").at(-1) || null; } catch { return null; } }, []);
  const [airflow, setAirflow] = useState(95);
  const [capacity, setCapacity] = useState(95);
  const [esp, setEsp] = useState(405);
  const [controls, setControls] = useState(false);
  const [documentation, setDocumentation] = useState(false);
  const [tolerance, setTolerance] = useState(10);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const previous = saved?.result?.airBalanceSystem;
  const designAirflow = n(previous?.requirements?.supplyAirflowCfm, 700);
  const designCapacity = n(previous?.requirements?.designCapacityKw, 8.8);
  const requiredEsp = n(previous?.requirements?.requiredFanEspPa, 396);

  const run = () => {
    setError("");
    try {
      const checks = calculateCommissioningChecks({
        designAirflowCfm: designAirflow,
        measuredAirflowCfm: n(airflow) === 0 ? designAirflow : n(airflow),
        airflowTolerancePercent: n(tolerance, 10),
        designCapacityKw: designCapacity,
        measuredCapacityKw: n(capacity) === 0 ? null : n(capacity),
        capacityTolerancePercent: n(tolerance, 10),
        requiredFanEspPa: requiredEsp,
        measuredFanEspPa: n(esp) === 0 ? null : n(esp),
        espTolerancePercent: n(tolerance, 10),
      });
      const checklist = buildCommissioningChecklist({ airflowCheck: checks, capacityCheck: checks, espCheck: checks, controlsVerified: controls, documentationVerified: documentation });
      const handover = buildCommissioningHandover({ projectId: saved?.id || "PROJECT-01", systemId: previous?.systemSummary?.systemId || "SYSTEM-01", checks, checklist });
      const payload = { inputs: { measuredAirflowCfm: n(airflow) === 0 ? designAirflow : n(airflow), measuredCapacityKw: n(capacity) || null, measuredFanEspPa: n(esp) || null, tolerancePercent: n(tolerance), controlsVerified: controls, documentationVerified: documentation }, checks, checklist, handover };
      if (saved) { const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]"); const current = projects.at(-1); current.result = { ...current.result, commissioning: payload }; localStorage.setItem("hvac-projects", JSON.stringify(projects)); }
      setResult(payload);
    } catch (e) { setError(e.message || "Unable to run commissioning checks."); }
  };

  return <div className="container"><div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 17</p><h1 className="title">System Commissioning & Handover</h1><p className="subtitle">Verify installed performance against the design basis before handover.</p></div><span className="version-badge">Stage 17</span></div><div className="grid calculator-grid"><div className="card"><div className="section-heading"><h3>Commissioning Measurements</h3><span>01</span></div><div className="input-grid"><Input label={`Measured airflow (design ${designAirflow.toFixed(0)} CFM)`} value={airflow} onChange={setAirflow} /><Input label={`Measured capacity (design ${designCapacity.toFixed(2)} kW)`} value={capacity} onChange={setCapacity} /><Input label={`Measured fan ESP (required ${requiredEsp.toFixed(1)} Pa)`} value={esp} onChange={setEsp} /><Input label="Tolerance" value={tolerance} onChange={setTolerance} /></div><label className="check-row"><input type="checkbox" checked={controls} onChange={(e) => setControls(e.target.checked)} /> Controls and sequence verified</label><label className="check-row"><input type="checkbox" checked={documentation} onChange={(e) => setDocumentation(e.target.checked)} /> As-built / commissioning documentation complete</label>{error && <p className="error-message">{error}</p>}<button onClick={run}>Run Commissioning</button></div><div className="card"><div className="section-heading"><h3>Handover Checklist</h3><span>02</span></div><p className="form-note">A PASS is not a substitute for witnessed testing, manufacturer commissioning requirements or project-specific acceptance criteria.</p>{result?.checklist?.items?.map((item) => <div className="check-row" key={item.id}><span>{item.status === "PASS" ? "✓" : "•"}</span><span>{item.name}</span><b>{item.status}</b></div>) || <p className="form-note">Run commissioning to populate the checklist.</p>}</div></div>{result && <div className="card"><div className="section-heading"><h3>Commissioning Result</h3><span>03</span></div><div className="stat-grid"><Stat label="Commissioning" value={result.checks.status} /><Stat label="Airflow deviation" value={`${result.checks.airflowDeviationPercent.toFixed(1)}%`} /><Stat label="Capacity deviation" value={result.checks.capacityDeviationPercent === null ? "PENDING" : `${result.checks.capacityDeviationPercent.toFixed(1)}%`} /><Stat label="ESP deviation" value={result.checks.espDeviationPercent === null ? "PENDING" : `${result.checks.espDeviationPercent.toFixed(1)}%`} /><Stat label="Handover" value={result.handover.commissioningStatus} /><Stat label="Handover ready" value={result.handover.handoverReady ? "YES" : "NO"} /></div><p className="engineering-note"><b>Engineering boundary:</b> commissioning tolerances are project inputs. Final acceptance requires witnessed TAB/commissioning measurements, manufacturer requirements, controls verification and complete project documentation.</p></div>}</div>;
}
function Input({ label, value, onChange }) { return <div><label>{label}</label><input type="number" value={value} onChange={(e) => onChange(e.target.value)} /></div>; }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><b>{value}</b></div>; }
