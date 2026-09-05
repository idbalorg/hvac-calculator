import { useMemo, useState } from "react";
import "../App.css";
import { calculateAirsideDesign } from "../engineering/airside/psychrometricDesign.js";

const DEFAULT_SUPPLY_C = 14;
const DEFAULT_LEAVING_RH = 90;

export default function AirsideDesign() {
  const saved = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("hvac-projects") || "[]").at(-1) || null; } catch { return null; }
  }, []);
  const [supplyDryBulbC, setSupplyDryBulbC] = useState(String(DEFAULT_SUPPLY_C));
  const [leavingRH, setLeavingRH] = useState(String(DEFAULT_LEAVING_RH));
  const [outdoorAirflowM3s, setOutdoorAirflowM3s] = useState("0");
  const [selectedRoomId, setSelectedRoomId] = useState(saved?.rooms?.[0]?.id || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    try {
      if (!saved?.result?.loads?.roomResults) throw new Error("Save a calculated project first from the main calculator.");
      const roomResult = saved.result.loads.roomResults.find((room) => room.roomId === selectedRoomId) || saved.result.loads.roomResults[0];
      const room = saved.rooms.find((item) => item.id === roomResult.roomId);
      const conditions = saved.result.designConditions;
      const airside = calculateAirsideDesign({
        roomLoad: { sensibleLoadW: roomResult.designLoad.sensibleW, totalLoadW: roomResult.designLoad.totalW },
        roomDryBulbC: conditions.indoor.dryBulbC,
        roomRelativeHumidityPercent: conditions.indoor.relativeHumidityPercent,
        supplyDryBulbC: Number(supplyDryBulbC),
        outdoorAirflowM3s: Number(outdoorAirflowM3s) || 0,
        outdoorAirState: { dryBulbC: conditions.selectedCoolingCondition.dryBulbC, relativeHumidityPercent: conditions.outdoor.relativeHumidityPercent },
        coolingCoilLeavingRHPercent: Number(leavingRH),
      });
      setResult({ room, roomResult, airside });
    } catch (e) { setResult(null); setError(e.message || "Please check the airside inputs."); }
  };

  return <div className="container">
    <div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 13</p><h1 className="title">Psychrometric & Airside Design</h1><p className="subtitle">Translate room cooling loads into supply airflow, air states, mixed-air condition and cooling-coil duty.</p></div><span className="version-badge">Airside Design</span></div>
    <div className="grid calculator-grid">
      <div className="card">
        <div className="section-heading"><h3>Airside Design Inputs</h3><span>01</span></div>
        {!saved && <p className="form-note">Calculate and save a project on the main calculator first. Stage 13 uses the saved engineering result rather than creating a separate load calculation.</p>}
        {saved && <div className="input-grid">
          <div><label>Room</label><select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}>{saved.rooms.map((room) => <option key={room.id} value={room.id}>{room.id} · {room.name || "Unnamed room"}</option>)}</select></div>
          <Input label="Supply-air dry bulb" value={supplyDryBulbC} onChange={setSupplyDryBulbC} type="number" placeholder="°C" />
          <Input label="Coil leaving-air RH" value={leavingRH} onChange={setLeavingRH} type="number" min="0" max="100" placeholder="%" />
          <Input label="Outdoor airflow" value={outdoorAirflowM3s} onChange={setOutdoorAirflowM3s} type="number" min="0" placeholder="m³/s" />
        </div>}
        {error && <p className="error-message">{error}</p>}
        <button onClick={calculate} disabled={!saved}>Run Airside Calculation</button>
      </div>

      {result && <div className="results-stack">
        <div className="card"><div className="section-heading"><h3>Room Airside Summary</h3><span>02</span></div><div className="stat"><span>Room</span><b>{result.roomResult.roomId} · {result.roomResult.roomName}</b></div><div className="stat"><span>Design sensible load</span><b>{(result.roomResult.designLoad.sensibleW / 1000).toFixed(2)} kW</b></div><div className="stat"><span>Design total load</span><b>{(result.roomResult.designLoad.totalW / 1000).toFixed(2)} kW</b></div><div className="stat"><span>Sensible heat ratio</span><b>{result.airside.sensibleHeatRatio.toFixed(3)}</b></div><div className="stat"><span>Required supply airflow</span><b>{result.airside.airflow.airflowM3h.toFixed(0)} m³/h · {result.airside.airflow.airflowLps.toFixed(1)} L/s</b></div><div className="stat"><span>Supply-air temperature</span><b>{result.airside.airflow.deltaTC.toFixed(1)} K below room</b></div></div>
        <div className="card"><div className="section-heading"><h3>Psychrometric States</h3><span>03</span></div><StateRow name="Room / return air" state={result.airside.roomAir} /><StateRow name="Outdoor air" state={result.airside.outdoorAir} /><StateRow name="Mixed air" state={result.airside.mixedAir} /><StateRow name="Coil leaving / supply air" state={result.airside.leavingAir} /></div>
        <div className="card"><div className="section-heading"><h3>Cooling Coil</h3><span>04</span></div><div className="stat"><span>Entering enthalpy</span><b>{result.airside.coil.enteringEnthalpyKJkg.toFixed(2)} kJ/kg</b></div><div className="stat"><span>Leaving enthalpy</span><b>{result.airside.coil.leavingEnthalpyKJkg.toFixed(2)} kJ/kg</b></div><div className="stat"><span>Coil sensible load</span><b>{(result.airside.coil.sensibleLoadW / 1000).toFixed(2)} kW</b></div><div className="stat"><span>Coil latent load</span><b>{(result.airside.coil.latentLoadW / 1000).toFixed(2)} kW</b></div><div className="stat"><span>Coil total load</span><b>{result.airside.coil.totalLoadKW.toFixed(2)} kW</b></div></div>
        <div className="card"><p className="engineering-note"><b>Engineering basis:</b> Supply temperature, coil leaving RH and outdoor airflow are explicit design inputs. Confirm the final supply-air condition, ventilation requirement, apparatus dew point/bypass factor, fan heat, duct heat gain and manufacturer coil selection during detailed design.</p></div>
      </div>}
    </div>
  </div>;
}

function StateRow({ name, state }) { return <div className="stat"><span>{name}</span><b>{state ? `${state.dryBulbC.toFixed(1)} °C · W ${state.humidityRatioKgKg.toFixed(5)} kg/kg · h ${state.enthalpyKJkg.toFixed(2)} kJ/kg` : "Not used"}</b></div>; }
function Input({ label, value, onChange, type = "text", min, max, placeholder }) { return <div><label>{label}</label><input type={type} min={min} max={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>; }
