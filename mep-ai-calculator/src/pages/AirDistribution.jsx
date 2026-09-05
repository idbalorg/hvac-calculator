import { useMemo, useState } from "react";
import "../App.css";
import { integrateAirDistribution, selectDistributionTerminal } from "../engineering/airside/fullAirDistribution.js";

const DEFAULTS = { branches: 2, velocity: 5, width: 0.2, branchLength: 8, frictionRate: 0.5, branchK: 1, terminalDrop: 25, coilDrop: 80, filterDrop: 30, damperDrop: 20, safety: 10, tolerance: 5 };

export default function AirDistribution() {
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem("hvac-projects") || "[]").at(-1) || null; } catch { return null; } }, []);
  const [roomId, setRoomId] = useState(saved?.rooms?.[0]?.id || "");
  const [branchCount, setBranchCount] = useState(String(DEFAULTS.branches));
  const [velocity, setVelocity] = useState(String(DEFAULTS.velocity));
  const [width, setWidth] = useState(String(DEFAULTS.width));
  const [branchLength, setBranchLength] = useState(String(DEFAULTS.branchLength));
  const [frictionRate, setFrictionRate] = useState(String(DEFAULTS.frictionRate));
  const [branchK, setBranchK] = useState(String(DEFAULTS.branchK));
  const [terminalDrop, setTerminalDrop] = useState(String(DEFAULTS.terminalDrop));
  const [coilDrop, setCoilDrop] = useState(String(DEFAULTS.coilDrop));
  const [filterDrop, setFilterDrop] = useState(String(DEFAULTS.filterDrop));
  const [damperDrop, setDamperDrop] = useState(String(DEFAULTS.damperDrop));
  const [safety, setSafety] = useState(String(DEFAULTS.safety));
  const [tolerance, setTolerance] = useState(String(DEFAULTS.tolerance));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    try {
      if (!saved?.result?.loads?.roomResults) throw new Error("Save a calculated project first.");
      const roomResult = saved.result.loads.roomResults.find((room) => room.roomId === roomId) || saved.result.loads.roomResults[0];
      const airside = saved.result.airside?.roomResults?.find?.((item) => item.roomId === roomResult.roomId);
      const dx = saved.result.dxSystem?.roomId === roomResult.roomId ? saved.result.dxSystem : null;
      if (!airside) throw new Error("Run Stage 13 for this room first. The saved airside result supplies the design airflow.");
      if (!dx?.selection?.selected) throw new Error("Run Stage 14 DX Equipment selection for this room first.");

      const count = Math.max(1, Math.floor(Number(branchCount)));
      const requiredAirflowM3s = airside.airflow?.airflowM3s;
      const requiredAirflowCfm = requiredAirflowM3s * 2118.88;
      const branchAirflowCfm = requiredAirflowCfm / count;
      const branches = Array.from({ length: count }, (_, index) => ({
        id: `B${index + 1}`,
        terminalIds: [`T${index + 1}`],
        airflowCfm: branchAirflowCfm,
        targetVelocityMps: Number(velocity), shape: "rectangular", widthM: Number(width),
        segments: [{ volumeFlowM3s: branchAirflowCfm / 2118.88, areaM2: Number(width) * (branchAirflowCfm / 2118.88 / Number(velocity) / Number(width)), lengthM: Number(branchLength), frictionRatePaPerM: Number(frictionRate), lossCoefficientK: Number(branchK) }],
      }));
      const terminal = selectDistributionTerminal({ requiredAirflowCfm, numberOfTerminals: count, terminals: [{ id: "USER-TERMINAL", type: "ceiling_diffuser", minAirflowCfm: 1, maxAirflowCfm: branchAirflowCfm * 1.5, pressureDropPa: Number(terminalDrop) }] });
      if (!terminal.suitable) throw new Error("The current terminal airflow range cannot serve the calculated airflow.");

      const integrated = integrateAirDistribution({
        selectedEquipmentAirflowCfm: dx.selection.selected.indoorUnit.airflowCfm,
        availableFanEspPa: dx.selection.selected.indoorUnit.availableEspPa ?? null,
        requiredAirflowM3s,
        branches,
        terminalSelection: terminal,
        terminalPressureDropPa: Number(terminalDrop), coilPressureDropPa: Number(coilDrop), filterPressureDropPa: Number(filterDrop), damperPressureDropPa: Number(damperDrop),
        espSafetyFactor: Number(safety) / 100, airflowToleranceFraction: Number(tolerance) / 100,
      });
      const payload = { roomId: roomResult.roomId, inputs: { branchCount: count, targetVelocityMps: Number(velocity), ductWidthM: Number(width), branchLengthM: Number(branchLength), frictionRatePaPerM: Number(frictionRate), branchLossK: Number(branchK), terminalPressureDropPa: Number(terminalDrop), coilPressureDropPa: Number(coilDrop), filterPressureDropPa: Number(filterDrop), damperPressureDropPa: Number(damperDrop), espSafetyFactorPercent: Number(safety), airflowTolerancePercent: Number(tolerance) }, ...integrated };
      const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]");
      if (projects.length) { const current = projects.at(-1); current.result = { ...current.result, airDistribution: payload }; localStorage.setItem("hvac-projects", JSON.stringify(projects)); }
      setResult({ roomResult, airside, dx, integrated });
    } catch (e) { setResult(null); setError(e.message || "Please check the air distribution inputs."); }
  };

  return <div className="container"><div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 15</p><h1 className="title">Air Distribution & Duct Integration</h1><p className="subtitle">Use the saved Stage 13 airflow and Stage 14 DX selection to size the distribution network and check ESP.</p></div><span className="version-badge">Air Distribution</span></div><div className="grid calculator-grid"><div className="card"><div className="section-heading"><h3>Distribution Inputs</h3><span>01</span></div>{!saved && <p className="form-note">Calculate and save a project first.</p>}{saved && <div className="input-grid"><div><label>Room</label><select value={roomId} onChange={(e) => setRoomId(e.target.value)}>{saved.rooms.map((room) => <option key={room.id} value={room.id}>{room.id} · {room.name || "Unnamed room"}</option>)}</select></div><Input label="Number of branches" value={branchCount} onChange={setBranchCount} type="number" min="1" /><Input label="Target duct velocity" value={velocity} onChange={setVelocity} type="number" min="0.1" placeholder="m/s" /><Input label="Duct width" value={width} onChange={setWidth} type="number" min="0.01" placeholder="m" /><Input label="Branch length" value={branchLength} onChange={setBranchLength} type="number" min="0" placeholder="m" /><Input label="Friction rate" value={frictionRate} onChange={setFrictionRate} type="number" min="0" placeholder="Pa/m" /><Input label="Branch fitting K" value={branchK} onChange={setBranchK} type="number" min="0" /><Input label="Terminal pressure drop" value={terminalDrop} onChange={setTerminalDrop} type="number" min="0" placeholder="Pa" /><Input label="Coil pressure drop" value={coilDrop} onChange={setCoilDrop} type="number" min="0" placeholder="Pa" /><Input label="Filter pressure drop" value={filterDrop} onChange={setFilterDrop} type="number" min="0" placeholder="Pa" /><Input label="Damper pressure drop" value={damperDrop} onChange={setDamperDrop} type="number" min="0" placeholder="Pa" /><Input label="ESP safety factor" value={safety} onChange={setSafety} type="number" min="0" placeholder="%" /><Input label="Airflow tolerance" value={tolerance} onChange={setTolerance} type="number" min="0" placeholder="%" /></div>}{error && <p className="error-message">{error}</p>}<button onClick={calculate} disabled={!saved}>Run Air Distribution</button></div>{result && <div className="results-stack"><div className="card"><div className="section-heading"><h3>Integrated Design Basis</h3><span>02</span></div><Stat label="Room" value={`${result.roomResult.roomId} · ${result.roomResult.roomName}`} /><Stat label="Stage 13 required airflow" value={`${result.integrated.airflow.requiredAirflowCfm.toFixed(0)} CFM · ${result.integrated.airflow.requiredAirflowM3s.toFixed(3)} m³/s`} /><Stat label="Stage 14 selected indoor airflow" value={`${result.integrated.airflowCheck.selectedEquipmentAirflowCfm.toFixed(0)} CFM`} /><Stat label="Airflow deviation" value={`${(result.integrated.airflowCheck.deviationFraction * 100).toFixed(1)}%`} /><Stat label="DX indoor unit" value={`${result.dx.selection.selected.indoorUnit.manufacturer} · ${result.dx.selection.selected.indoorUnit.model}`} /></div><div className="card"><div className="section-heading"><h3>Duct Network</h3><span>03</span></div><Stat label="Branches" value={String(result.integrated.distribution.branches.length)} /><Stat label="Supply airflow" value={`${result.integrated.distribution.totalSupplyAirflowCfm.toFixed(0)} CFM`} /><Stat label="Critical duct loss" value={`${result.integrated.criticalDuctLossPa.toFixed(1)} Pa`} /><Stat label="Required fan ESP" value={`${result.integrated.esp.requiredFanESP_Pa.toFixed(1)} Pa`} /></div><div className="card"><div className="section-heading"><h3>Equipment vs System</h3><span>04</span></div><Stat label="Available fan ESP" value={result.integrated.espCheck.availableFanEspPa == null ? "Not supplied" : `${result.integrated.espCheck.availableFanEspPa.toFixed(1)} Pa`} /><Stat label="ESP margin" value={result.integrated.espCheck.marginPa == null ? "Not checked" : `${result.integrated.espCheck.marginPa.toFixed(1)} Pa`} /><Stat label="Status" value={result.integrated.engineeringStatus.replaceAll("_", " ")} />{result.integrated.warnings.length > 0 && <div className="warning-list">{result.integrated.warnings.map((warning) => <p key={warning}>{warning.replaceAll("_", " ")}</p>)}</div>}<p className="engineering-note"><b>Engineering basis:</b> Duct velocity, friction rate, fitting K-values, component pressure drops and airflow tolerance are explicit project inputs. Final duct dimensions, terminal performance, fan duty and balancing must be verified against the detailed layout, manufacturer data and field measurements.</p></div></div>}</div></div>;
}
function Input({ label, value, onChange, type = "text", min, max, placeholder }) { return <div><label>{label}</label><input type={type} min={min} max={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>; }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><b>{value}</b></div>; }
