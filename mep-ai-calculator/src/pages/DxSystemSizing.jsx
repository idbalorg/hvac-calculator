import { useMemo, useState } from "react";
import "../App.css";
import { integrateDxSystemSelection } from "../engineering/systems/dxSystemIntegration.js";

const DEFAULT_MARGIN = 10;
const DEFAULT_MAX_OVERSIZE = 15;

export default function DxSystemSizing() {
  const saved = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("hvac-projects") || "[]").at(-1) || null; } catch { return null; }
  }, []);
  const [selectedRoomId, setSelectedRoomId] = useState(saved?.rooms?.[0]?.id || "");
  const [margin, setMargin] = useState(String(DEFAULT_MARGIN));
  const [maxOversize, setMaxOversize] = useState(String(DEFAULT_MAX_OVERSIZE));
  const [requiredEsp, setRequiredEsp] = useState("");
  const [indoorCapacity, setIndoorCapacity] = useState("5.5");
  const [indoorAirflow, setIndoorAirflow] = useState("700");
  const [indoorEsp, setIndoorEsp] = useState("120");
  const [outdoorCapacity, setOutdoorCapacity] = useState("5.5");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    try {
      if (!saved?.result?.loads?.roomResults) throw new Error("Save a calculated project first from the main calculator.");
      const roomResult = saved.result.loads.roomResults.find((room) => room.roomId === selectedRoomId) || saved.result.loads.roomResults[0];
      const airside = saved.result.airside?.roomResults?.find?.((room) => room.roomId === roomResult.roomId);
      const requiredAirflowM3s = airside?.airflow?.airflowM3s ?? null;
      const integrated = integrateDxSystemSelection({
        roomDesignLoadW: roomResult.designLoad.totalW,
        roomSensibleLoadW: roomResult.designLoad.sensibleW,
        coilTotalLoadW: null,
        requiredAirflowM3s,
        requiredEspPa: requiredEsp === "" ? null : Number(requiredEsp),
        designMarginPercent: Number(margin),
        maxOversizeFraction: Number(maxOversize) / 100,
        indoorUnits: [{ id: "IND-01", manufacturer: "User Catalogue", model: "IND-01", type: "ceiling-cassette", coolingCapacityKw: Number(indoorCapacity), airflowCfm: Number(indoorAirflow), availableEspPa: Number(indoorEsp), compatibleOutdoorUnitIds: ["OUT-01"] }],
        outdoorUnits: [{ id: "OUT-01", manufacturer: "User Catalogue", model: "OUT-01", type: "condensing-unit", coolingCapacityKw: Number(outdoorCapacity) }],
      });
      setResult({ roomResult, integrated });
    } catch (e) { setResult(null); setError(e.message || "Please check the DX sizing inputs."); }
  };

  return <div className="container">
    <div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 14</p><h1 className="title">DX System Sizing & Equipment Integration</h1><p className="subtitle">Connect the room design load and airside requirement to a user-supplied DX equipment catalogue.</p></div><span className="version-badge">DX Integration</span></div>
    <div className="grid calculator-grid">
      <div className="card">
        <div className="section-heading"><h3>Selection Inputs</h3><span>01</span></div>
        {!saved && <p className="form-note">Calculate and save a project on the main calculator first. Stage 14 uses the saved room design result.</p>}
        {saved && <div className="input-grid">
          <div><label>Room</label><select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}>{saved.rooms.map((room) => <option key={room.id} value={room.id}>{room.id} · {room.name || "Unnamed room"}</option>)}</select></div>
          <Input label="Design margin" value={margin} onChange={setMargin} type="number" min="0" max="20" placeholder="%" />
          <Input label="Maximum oversize" value={maxOversize} onChange={setMaxOversize} type="number" min="0" placeholder="%" />
          <Input label="Required ESP" value={requiredEsp} onChange={setRequiredEsp} type="number" min="0" placeholder="Pa (optional)" />
          <Input label="Indoor capacity" value={indoorCapacity} onChange={setIndoorCapacity} type="number" min="0.1" placeholder="kW" />
          <Input label="Indoor airflow" value={indoorAirflow} onChange={setIndoorAirflow} type="number" min="1" placeholder="CFM" />
          <Input label="Indoor available ESP" value={indoorEsp} onChange={setIndoorEsp} type="number" min="0" placeholder="Pa" />
          <Input label="Outdoor capacity" value={outdoorCapacity} onChange={setOutdoorCapacity} type="number" min="0.1" placeholder="kW" />
        </div>}
        {error && <p className="error-message">{error}</p>}
        <button onClick={calculate} disabled={!saved}>Run DX Selection</button>
      </div>

      {result && <div className="results-stack">
        <div className="card"><div className="section-heading"><h3>DX Sizing Basis</h3><span>02</span></div><Stat label="Room design load" value={`${(result.roomResult.designLoad.totalW / 1000).toFixed(2)} kW`} /><Stat label="Sizing basis" value={result.integrated.capacityBasis.basis.replaceAll("_", " ")} /><Stat label="Required DX capacity" value={`${result.integrated.capacityBasis.sizing.requiredCapacityKW.toFixed(2)} kW`} /><Stat label="Required airflow" value={result.integrated.requiredAirflowCfm == null ? "Not supplied by saved airside result" : `${result.integrated.requiredAirflowCfm.toFixed(0)} CFM`} /></div>
        <div className="card"><div className="section-heading"><h3>Equipment Selection</h3><span>03</span></div>{result.integrated.selection.selected ? <><Stat label="Indoor unit" value={`${result.integrated.selection.selected.indoorUnit.manufacturer} · ${result.integrated.selection.selected.indoorUnit.model}`} /><Stat label="Outdoor unit" value={`${result.integrated.selection.selected.outdoorUnit.manufacturer} · ${result.integrated.selection.selected.outdoorUnit.model}`} /><Stat label="Selected capacity" value={`${result.integrated.coverage.selectedCapacityKW.toFixed(2)} kW`} /><Stat label="Capacity coverage" value={`${(result.integrated.coverage.coverageRatio * 100).toFixed(1)}%`} /><Stat label="Excess capacity" value={`${result.integrated.coverage.excessCapacityKW.toFixed(2)} kW`} /></> : <p className="error-message">No valid indoor/outdoor DX pair meets the current requirements.</p>}</div>
        <div className="card"><div className="section-heading"><h3>Engineering Status</h3><span>04</span></div><Stat label="Status" value={result.integrated.engineeringStatus.replaceAll("_", " ")} /><Stat label="Verification" value={result.integrated.verificationRequired ? "Required before final selection" : "Not required"} />{result.integrated.warnings.length > 0 && <div className="warning-list">{result.integrated.warnings.map((warning) => <p key={warning}>{warning.replaceAll("_", " ")}</p>)}</div>}<p className="engineering-note"><b>Important:</b> Catalogue values are user inputs. Final selection must be checked against the manufacturer's certified performance data, indoor/outdoor combination, operating conditions, controls, refrigerant requirements and project specifications.</p></div>
      </div>}
    </div>
  </div>;
}

function Input({ label, value, onChange, type = "text", min, max, placeholder }) { return <div><label>{label}</label><input type={type} min={min} max={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>; }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><b>{value}</b></div>; }
