import { useMemo, useState } from "react";
import "../App.css";
import { buildProjectRooms, calculateProjectRoomSummary, createRoom } from "../engineering/project/projectRooms.js";
import { calculateProjectCoolingLoads } from "../engineering/cooling-load/roomLoadEngine.js";
import { recommendHVACSystems } from "../engineering/system/systemDecision.js";
import { buildProjectDesignConditions, listDesignConditions } from "../engineering/project/designConditions.js";

const blankRoom = (id = "ROOM-1") => ({ id, name: "", length: "", width: "", height: "", people: "", equipmentLoadKw: "", windowAreaM2: "" });

const designConditionOptions = listDesignConditions();

export default function CoolingLoadCalculator() {
  const [rooms, setRooms] = useState([blankRoom()]);
  const [criteria, setCriteria] = useState({ ventilation: false, ceiling: false, outdoor: false, plant: false });
  const [zoning, setZoning] = useState("medium");
  const [designMarginPercent, setDesignMarginPercent] = useState("10");
  const [designConditionId, setDesignConditionId] = useState("LAGOS_IKEJA_ASHRAE_2021");
  const [coolingPercentile, setCoolingPercentile] = useState("percentile04");
  const [indoorDryBulbC, setIndoorDryBulbC] = useState("24");
  const [indoorRelativeHumidityPercent, setIndoorRelativeHumidityPercent] = useState("50");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const validRooms = rooms.filter((room) => room.name && Number(room.length) > 0 && Number(room.width) > 0 && Number(room.height) > 0);
    if (!validRooms.length) return null;
    try { return calculateProjectRoomSummary(validRooms.map(toEngineeringRoom)); } catch { return null; }
  }, [rooms]);

  const updateRoom = (index, key, value) => setRooms((current) => current.map((room, i) => i === index ? { ...room, [key]: value } : room));
  const addRoom = () => setRooms((current) => [...current, blankRoom(`ROOM-${current.length + 1}`)]);
  const removeRoom = (index) => setRooms((current) => current.length === 1 ? current : current.filter((_, i) => i !== index));

  const calculate = () => {
    setError("");
    try {
      const engineeringRooms = rooms.map(toEngineeringRoom);
      const builtRooms = buildProjectRooms(engineeringRooms);
      const projectSummary = calculateProjectRoomSummary(engineeringRooms);
      const margin = Number(designMarginPercent) || 0;
      const designConditions = buildProjectDesignConditions({
        outdoorConditionId: designConditionId,
        coolingPercentile,
        indoorDryBulbC: Number(indoorDryBulbC),
        indoorRelativeHumidityPercent: Number(indoorRelativeHumidityPercent),
      });

      // Detailed envelope, solar, lighting, ventilation and infiltration
      // factors remain explicit engineering inputs. Until their forms are
      // completed, the load engine receives zero component factors rather than
      // silently inventing design assumptions.
      const engineeringByRoom = Object.fromEntries(engineeringRooms.map((room) => [room.id, buildDefaultEngineeringInputs(room, designConditions)]));
      const loads = calculateProjectCoolingLoads({ rooms: engineeringRooms, engineeringByRoom, designMarginPercent: margin });
      const decision = recommendHVACSystems({
        totalCoolingLoadKw: Math.max(loads.totalDesignLoadKw, 0.001),
        floorAreaM2: Math.max(projectSummary.floorAreaM2, 0.001),
        zoneCount: builtRooms.length,
        ventilationRequired: criteria.ventilation,
        zoningPriority: zoning,
        ceilingSpaceLimited: criteria.ceiling,
        outdoorUnitSpaceLimited: criteria.outdoor,
        centralPlantAvailable: criteria.plant,
      });
      setResult({ rooms: builtRooms, summary: projectSummary, loads, decision, designConditions });
    } catch (e) {
      setResult(null);
      setError(e.message || "Please check the project inputs.");
    }
  };

  const saveProject = () => {
    if (!result) return;
    const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]");
    localStorage.setItem("hvac-projects", JSON.stringify([...projects, {
      rooms,
      criteria,
      zoning,
      designMarginPercent,
      designConditionId,
      coolingPercentile,
      indoorDryBulbC,
      indoorRelativeHumidityPercent,
      result,
      date: new Date().toISOString(),
    }]));
  };

  return <div className="container">
    <div className="page-header">
      <div><p className="eyebrow">ENGINEERING WORKFLOW</p><h1 className="title">HVAC Design Calculator</h1><p className="subtitle">Project-level room input, design conditions, component cooling-load calculation and HVAC system selection.</p></div>
      <span className="version-badge">Engineering Core v2</span>
    </div>

    <div className="grid calculator-grid">
      <div className="card">
        <div className="section-heading"><h3>Project Rooms</h3><span>01</span></div>
        <p className="form-note">Enter each conditioned space separately. Room IDs must be unique.</p>
        {rooms.map((room, index) => <div className="room-card" key={`${room.id}-${index}`}>
          <div className="room-card-header"><strong>Room {index + 1}</strong>{rooms.length > 1 && <button type="button" className="icon-button" onClick={() => removeRoom(index)}>Remove</button>}</div>
          <div className="input-grid">
            <Input label="Room ID" value={room.id} onChange={(v) => updateRoom(index, "id", v)} placeholder="ROOM-1" />
            <Input label="Room name" value={room.name} onChange={(v) => updateRoom(index, "name", v)} placeholder="Open Office" />
            <Input label="Length" value={room.length} onChange={(v) => updateRoom(index, "length", v)} placeholder="m" type="number" />
            <Input label="Width" value={room.width} onChange={(v) => updateRoom(index, "width", v)} placeholder="m" type="number" />
            <Input label="Height" value={room.height} onChange={(v) => updateRoom(index, "height", v)} placeholder="m" type="number" />
            <Input label="Occupants" value={room.people} onChange={(v) => updateRoom(index, "people", v)} placeholder="People" type="number" min="0" />
            <Input label="Equipment load" value={room.equipmentLoadKw} onChange={(v) => updateRoom(index, "equipmentLoadKw", v)} placeholder="kW" type="number" min="0" />
            <Input label="Window area" value={room.windowAreaM2} onChange={(v) => updateRoom(index, "windowAreaM2", v)} placeholder="m²" type="number" min="0" />
          </div>
        </div>)}
        <button type="button" className="secondary-button" onClick={addRoom}>+ Add Room</button>

        <div className="section-heading compact"><h3>Design Conditions</h3><span>02</span></div>
        <p className="form-note">Climate data is stored with its source and edition. Indoor conditions are project inputs.</p>
        <div className="input-grid">
          <div><label>Outdoor design condition</label><select value={designConditionId} onChange={(e) => setDesignConditionId(e.target.value)}>{designConditionOptions.map((condition) => <option key={condition.id} value={condition.id}>{condition.location} · ASHRAE {condition.sourceEdition}</option>)}</select></div>
          <div><label>Cooling design percentile</label><select value={coolingPercentile} onChange={(e) => setCoolingPercentile(e.target.value)}><option value="percentile04">0.4%</option><option value="percentile1">1.0%</option><option value="percentile2">2.0%</option></select></div>
          <Input label="Indoor dry-bulb" value={indoorDryBulbC} onChange={setIndoorDryBulbC} placeholder="°C" type="number" />
          <Input label="Indoor relative humidity" value={indoorRelativeHumidityPercent} onChange={setIndoorRelativeHumidityPercent} placeholder="%" type="number" min="0" />
        </div>
        <div className="condition-summary">
          {(() => { const condition = designConditionOptions.find((item) => item.id === designConditionId); const selected = condition?.cooling?.db?.[coolingPercentile]; return <><span>{condition?.location}</span><span>Outdoor DB: <b>{selected?.dryBulbC} °C</b></span><span>MCWB: <b>{selected?.meanCoincidentWetBulbC} °C</b></span><span>Indoor: <b>{indoorDryBulbC} °C / {indoorRelativeHumidityPercent}% RH</b></span></>; })()}
        </div>

        <div className="section-heading compact"><h3>Load & System Criteria</h3><span>03</span></div>
        <div className="input-grid">
          <Input label="Design margin" value={designMarginPercent} onChange={setDesignMarginPercent} placeholder="%" type="number" min="0" />
          <div><label>Zoning priority</label><select value={zoning} onChange={(e) => setZoning(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        </div>
        <div className="checks">
          <Check label="Dedicated ventilation required" checked={criteria.ventilation} onChange={(v) => setCriteria((c) => ({ ...c, ventilation: v }))} />
          <Check label="Ceiling/service space limited" checked={criteria.ceiling} onChange={(v) => setCriteria((c) => ({ ...c, ceiling: v }))} />
          <Check label="Outdoor-unit space limited" checked={criteria.outdoor} onChange={(v) => setCriteria((c) => ({ ...c, outdoor: v }))} />
          <Check label="Central plant available" checked={criteria.plant} onChange={(v) => setCriteria((c) => ({ ...c, plant: v }))} />
        </div>
        {summary && <div className="project-mini-summary"><span>{summary.roomCount} rooms</span><span>{summary.floorAreaM2.toFixed(1)} m²</span><span>{summary.occupants} occupants</span></div>}
        {error && <p className="error-message">{error}</p>}
        <button onClick={calculate}>Run Engineering Assessment</button>
      </div>

      {result && <div className="results-stack">
        <div className="card"><div className="section-heading"><h3>Design Conditions</h3><span>04</span></div>
          <div className="stat"><span>Location</span><b>{result.designConditions.outdoor.location}</b></div>
          <div className="stat"><span>Source</span><b>ASHRAE {result.designConditions.outdoor.sourceEdition}</b></div>
          <div className="stat"><span>Cooling basis</span><b>{result.designConditions.selectedCoolingCondition.percentile.replace("percentile", "").replace("04", "0.4%").replace("1", "1%").replace("2", "2%")}</b></div>
          <div className="stat"><span>Outdoor DB / MCWB</span><b>{result.designConditions.selectedCoolingCondition.dryBulbC} / {result.designConditions.selectedCoolingCondition.meanCoincidentWetBulbC} °C</b></div>
          <div className="stat"><span>Indoor DB / RH</span><b>{result.designConditions.indoor.dryBulbC} °C / {result.designConditions.indoor.relativeHumidityPercent}%</b></div>
        </div>

        <div className="card"><div className="section-heading"><h3>Project Cooling Load</h3><span>05</span></div>
          <div className="stat"><span>Conditioned Area</span><b>{result.summary.floorAreaM2.toFixed(2)} m²</b></div>
          <div className="stat"><span>Room Volume</span><b>{result.summary.volumeM3.toFixed(2)} m³</b></div>
          <div className="stat"><span>Total Occupants</span><b>{result.summary.occupants}</b></div>
          <div className="stat"><span>Raw Cooling Load</span><b>{result.loads.totalRawLoadKw.toFixed(2)} kW</b></div>
          <div className="stat"><span>Design Cooling Load</span><b>{result.loads.totalDesignLoadKw.toFixed(2)} kW</b></div>
        </div>

        <div className="card"><div className="section-heading"><h3>Room Load Schedule</h3><span>06</span></div>
          {result.loads.roomResults.map((room) => <div className="stat" key={room.roomId}><span>{room.roomName} · {room.geometry.floorAreaM2.toFixed(1)} m²</span><b>{(room.designLoad.totalW / 1000).toFixed(2)} kW</b></div>)}
        </div>

        <div className="card decision-card"><div className="section-heading"><h3>System Decision</h3><span>07</span></div>
          <div className="recommendation"><span>Recommended system</span><strong>{result.decision.recommendedLabel}</strong><small>{result.decision.confidence === "RELATIVE_HIGH" ? "Strongest rule-based option" : "Engineering review required"}</small></div>
          <div className="ranking-list">{result.decision.options.map((option, index) => <div className={`ranking-row ${index === 0 ? "selected" : ""}`} key={option.systemType}><span className="rank">{index + 1}</span><div><b>{option.label}</b><small>{option.reasons[0] || option.warnings[0] || "Viable for further evaluation"}</small></div><strong>{option.score}</strong></div>)}</div>
          <p className="engineering-note">{result.decision.engineeringNote}</p><button className="secondary-button" onClick={saveProject}>Save Project</button>
        </div>
      </div>}
    </div>
  </div>;
}

function toEngineeringRoom(room) {
  return createRoom({ id: room.id, name: room.name, length: Number(room.length), width: Number(room.width), height: Number(room.height), people: Number(room.people) || 0, equipmentLoadKw: Number(room.equipmentLoadKw) || 0, windowAreaM2: Number(room.windowAreaM2) || 0 });
}

function buildDefaultEngineeringInputs(room, designConditions) {
  const outdoor = designConditions.selectedCoolingCondition;
  const indoor = designConditions.indoor;
  return {
    walls: { area: room.length * room.height * 2, uValue: 0, cltd: 0 },
    roof: { area: room.length * room.width, uValue: 0, cltd: 0 },
    windows: { area: room.windowAreaM2, uValue: 0, cltd: 0, shgc: 0, solarIrradiance: 0 },
    people: { sensibleHeatPerPerson: 0, latentHeatPerPerson: 0 },
    lighting: { powerDensity: 0 },
    equipment: [],
    ventilation: { outdoorAirPerPersonLps: 0, outdoorAirPerAreaLpsM2: 0, indoorDryBulbC: indoor.dryBulbC, indoorRelativeHumidityPercent: indoor.relativeHumidityPercent, outdoorDryBulbC: outdoor.dryBulbC, outdoorRelativeHumidityPercent: indoor.relativeHumidityPercent },
    infiltration: { infiltrationAirLps: 0, indoorDryBulbC: indoor.dryBulbC, indoorRelativeHumidityPercent: indoor.relativeHumidityPercent, outdoorDryBulbC: outdoor.dryBulbC, outdoorRelativeHumidityPercent: indoor.relativeHumidityPercent },
  };
}

function Input({ label, value, onChange, placeholder, type = "text", min }) { return <div><label>{label}</label><input type={type} min={min} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>; }
function Check({ label, checked, onChange }) { return <label className="check-row"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}</label>; }
