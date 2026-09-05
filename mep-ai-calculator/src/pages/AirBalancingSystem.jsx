import { useMemo, useState } from "react";
import "../App.css";
import { integrateAirBalancingAndSystem } from "../engineering/airside/airBalanceSystemIntegration.js";

const DEFAULTS = { tolerance: 10, capacityMargin: 10, espSafety: 10, maxOversize: 20, critical: 180, terminal: 30, coil: 80, filter: 40, damper: 20, other: 10, selectedCapacity: 9, selectedAirflow: 800, selectedEsp: 440 };
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function AirBalancingSystem() {
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem("hvac-projects") || "[]").at(-1) || null; } catch { return null; } }, []);
  const rooms = saved?.rooms || [];
  const loadResults = saved?.result?.loads?.roomResults || [];
  const [roomId, setRoomId] = useState(rooms[0]?.id || loadResults[0]?.roomId || "");
  const [tolerance, setTolerance] = useState(String(DEFAULTS.tolerance));
  const [measured, setMeasured] = useState({});
  const [capacityMargin, setCapacityMargin] = useState(String(DEFAULTS.capacityMargin));
  const [espSafety, setEspSafety] = useState(String(DEFAULTS.espSafety));
  const [maxOversize, setMaxOversize] = useState(String(DEFAULTS.maxOversize));
  const [selectedCapacity, setSelectedCapacity] = useState(String(DEFAULTS.selectedCapacity));
  const [selectedAirflow, setSelectedAirflow] = useState(String(DEFAULTS.selectedAirflow));
  const [selectedEsp, setSelectedEsp] = useState(String(DEFAULTS.selectedEsp));
  const [pressure, setPressure] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const roomResult = loadResults.find((item) => item.roomId === roomId) || loadResults[0];
  const activeRoomId = roomResult?.roomId || roomId;
  const airside = saved?.result?.airside?.roomResults?.find?.((item) => item.roomId === activeRoomId);
  const dx = saved?.result?.dxSystem?.roomId === activeRoomId ? saved.result.dxSystem : null;
  const distribution = saved?.result?.airDistribution?.roomId === activeRoomId ? saved.result.airDistribution : null;
  const designAirflowCfm = n(airside?.airflow?.airflowM3s) * 2118.88;
  const defaultMeasured = designAirflowCfm || 400;

  const run = () => {
    setError(""); setResult(null);
    try {
      if (!roomResult) throw new Error("Save a calculated project first.");
      if (!airside) throw new Error("Run Stage 13 Psychrometrics & Airside for this room first.");
      if (!dx?.selection?.selected) throw new Error("Run Stage 14 DX Equipment selection for this room first.");
      if (!distribution?.criticalDuctLossPa && distribution?.criticalDuctLossPa !== 0) throw new Error("Run Stage 15 Air Distribution for this room first.");

      const designCfm = designAirflowCfm;
      const measuredCfm = n(measured[activeRoomId], designCfm);
      const selectedIndoor = dx.selection.selected.indoorUnit;
      const integrated = integrateAirBalancingAndSystem({
        terminals: [{ id: "T1", roomId: activeRoomId, designAirflowCfm: designCfm, measuredAirflowCfm: measuredCfm }],
        branchPressureLossesPa: [{ id: "B1", pressureLossPa: n(distribution.criticalDuctLossPa, n(pressure.critical)) }],
        tolerancePercent: n(tolerance, 10),
        roomLoadsKw: [n(roomResult.designLoadW) / 1000],
        roomAirflowsCfm: [designCfm],
        outdoorAirflowCfm: n(airside.outdoorAirflowM3s) * 2118.88,
        transferAirflowCfm: 0,
        criticalPathPressureLossPa: n(distribution.criticalDuctLossPa, n(pressure.critical)),
        terminalPressureDropPa: n(pressure.terminal), coilPressureDropPa: n(pressure.coil), filterPressureDropPa: n(pressure.filter), damperPressureDropPa: n(pressure.damper), otherPressureDropsPa: [n(pressure.other)],
        espSafetyFactor: n(espSafety) / 100,
        capacityMargin: n(capacityMargin) / 100,
        selectedCapacityKw: n(selectedCapacity, n(selectedIndoor.capacityKw, 0)),
        selectedAirflowCfm: n(selectedAirflow, n(selectedIndoor.airflowCfm, designCfm)),
        selectedFanEspPa: n(selectedEsp, n(selectedIndoor.availableEspPa, 0)),
        maxOversizeFraction: n(maxOversize) / 100,
      });

      const payload = { roomId: activeRoomId, inputs: { tolerancePercent: n(tolerance), capacityMarginPercent: n(capacityMargin), espSafetyFactorPercent: n(espSafety), maxOversizePercent: n(maxOversize), measuredAirflowCfm: measuredCfm, ...pressure, selectedCapacityKw: n(selectedCapacity), selectedAirflowCfm: n(selectedAirflow), selectedFanEspPa: n(selectedEsp) }, ...integrated };
      const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]");
      if (projects.length) { const current = projects.at(-1); current.result = { ...current.result, airBalanceSystem: payload }; localStorage.setItem("hvac-projects", JSON.stringify(projects)); }
      setResult(payload);
    } catch (e) { setError(e.message || "Please check the Stage 16 inputs."); }
  };

  return <div className="container"><div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 16</p><h1 className="title">Air Balancing & System Integration</h1><p className="subtitle">Carry the Stage 15 duct network into terminal balancing and system-level verification.</p></div><span className="version-badge">Stage 16</span></div><div className="grid calculator-grid"><div className="card"><div className="section-heading"><h3>Workflow Inputs</h3><span>01</span></div>{!saved && <p className="form-note">Calculate and save a project first.</p>}{saved && <div className="input-grid"><div><label>Room</label><select value={activeRoomId} onChange={(e) => setRoomId(e.target.value)}>{rooms.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name || "Unnamed room"}</option>)}</select></div><Input label="Balance tolerance" value={tolerance} onChange={setTolerance} placeholder="%" /><Input label="Measured terminal airflow" value={measured[activeRoomId] ?? defaultMeasured.toFixed(0)} onChange={(v) => setMeasured({ ...measured, [activeRoomId]: v })} placeholder="CFM" /><Input label="Capacity margin" value={capacityMargin} onChange={setCapacityMargin} placeholder="%" /><Input label="ESP safety factor" value={espSafety} onChange={setEspSafety} placeholder="%" /><Input label="Maximum oversize" value={maxOversize} onChange={setMaxOversize} placeholder="%" /></div>}{error && <p className="error-message">{error}</p>}<button onClick={run} disabled={!saved}>Run Stage 16</button></div><div className="results-stack"><div className="card"><div className="section-heading"><h3>Selected Equipment</h3><span>02</span></div><div className="input-grid"><Input label="Selected capacity" value={selectedCapacity} onChange={setSelectedCapacity} placeholder="kW" /><Input label="Selected airflow" value={selectedAirflow} onChange={setSelectedAirflow} placeholder="CFM" /><Input label="Selected fan ESP" value={selectedEsp} onChange={setSelectedEsp} placeholder="Pa" /></div><p className="form-note">Defaults are editable. Final equipment values must come from the actual manufacturer selection.</p></div><div className="card"><div className="section-heading"><h3>Pressure-Drop Basis</h3><span>03</span></div><div className="input-grid"><Input label="Critical duct loss" value={pressure.critical} onChange={(v) => setPressure({ ...pressure, critical: v })} placeholder="Pa" /><Input label="Terminal" value={pressure.terminal} onChange={(v) => setPressure({ ...pressure, terminal: v })} placeholder="Pa" /><Input label="Coil" value={pressure.coil} onChange={(v) => setPressure({ ...pressure, coil: v })} placeholder="Pa" /><Input label="Filter" value={pressure.filter} onChange={(v) => setPressure({ ...pressure, filter: v })} placeholder="Pa" /><Input label="Damper" value={pressure.damper} onChange={(v) => setPressure({ ...pressure, damper: v })} placeholder="Pa" /><Input label="Other" value={pressure.other} onChange={(v) => setPressure({ ...pressure, other: v })} placeholder="Pa" /></div></div></div></div>{result && <div className="card"><div className="section-heading"><h3>Integrated Result</h3><span>04</span></div><div className="stat-grid"><Stat label="Engineering status" value={result.engineeringStatus.replaceAll("_", " ")} /><Stat label="Terminal balance" value={`${result.balanceReport.summary.balancedCount}/${result.balanceReport.summary.total} balanced`} /><Stat label="Airflow deviation" value={`${result.balanceReport.rows[0].deviationPercent.toFixed(1)}%`} /><Stat label="Critical branch" value={result.branchBalancing.criticalBranchId} /><Stat label="Required capacity" value={`${result.requirements.designCapacityKw.toFixed(2)} kW`} /><Stat label="Required fan ESP" value={`${result.requirements.requiredFanEspPa.toFixed(1)} Pa`} /><Stat label="Selected capacity" value={`${result.selection.selectedCapacityKw.toFixed(2)} kW`} /><Stat label="System selection" value={result.selection.passed ? "PASS" : "FAIL"} /></div><p className="engineering-note"><b>Engineering boundary:</b> balancing status uses measured airflow supplied by the user. Damper pressure-drop values are design targets, not field settings. Final TAB measurements, terminal performance, equipment data and system selection must be verified before construction use.</p></div>}</div></div>;
}
function Input({ label, value, onChange, placeholder }) { return <div><label>{label}</label><input type="number" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>; }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><b>{value}</b></div>; }
