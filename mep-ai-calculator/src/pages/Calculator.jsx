import { useMemo, useState } from "react";
import "../App.css";
import { buildProjectRooms, calculateProjectRoomSummary, createRoom } from "../engineering/project/projectRooms.js";
import { calculateProjectCoolingLoads } from "../engineering/cooling-load/roomLoadEngine.js";
import { recommendHVACSystems } from "../engineering/system/systemDecision.js";
import { buildProjectDesignConditions, listDesignConditions } from "../engineering/project/designConditions.js";

const blankRoom = (id = "ROOM-1") => ({ id, name: "", length: "", width: "", height: "", people: "", equipmentLoadKw: "", windowAreaM2: "" });

const designConditionOptions = listDesignConditions();

const DEFAULT_LOAD_INPUTS = {
  wallUValue: "0.50",
  wallCltd: "8",
  roofUValue: "0.40",
  roofCltd: "10",
  windowUValue: "2.80",
  windowCltd: "6",
  windowShgc: "0.40",
  solarIrradiance: "250",
  sensibleHeatPerPerson: "75",
  latentHeatPerPerson: "55",
  lightingPowerDensity: "10",
};

export default function CoolingLoadCalculator() {
  const [rooms, setRooms] = useState([blankRoom()]);
  const [criteria, setCriteria] = useState({ ventilation: false, ceiling: false, outdoor: false, plant: false });
  const [zoning, setZoning] = useState("medium");
  const [designMarginPercent, setDesignMarginPercent] = useState("10");
  const [designConditionId, setDesignConditionId] = useState("LAGOS_IKEJA_ASHRAE_2021");
  const [coolingPercentile, setCoolingPercentile] = useState("percentile04");
  const [indoorDryBulbC, setIndoorDryBulbC] = useState("24");
  const [indoorRelativeHumidityPercent, setIndoorRelativeHumidityPercent] = useState("50");
  const [loadInputs, setLoadInputs] = useState(DEFAULT_LOAD_INPUTS);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const validRooms = rooms.filter((room) => room.name && Number(room.length) > 0 && Number(room.width) > 0 && Number(room.height) > 0);
    if (!validRooms.length) return null;
    try { return calculateProjectRoomSummary(validRooms.map(toEngineeringRoom)); } catch { return null; }
  }, [rooms]);

  const updateRoom = (index, key, value) => {
    if (key === "id") return;
    setRooms((current) => current.map((room, i) => i === index ? { ...room, [key]: value } : room));
  };
  const addRoom = () => setRooms((current) => [...current, blankRoom(`ROOM-${current.length + 1}`)]);
  const removeRoom = (index) => setRooms((current) => current.length === 1 ? current : current.filter((_, i) => i !== index));
  const updateLoadInput = (key, value) => setLoadInputs((current) => ({ ...current, [key]: value }));

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

      const engineeringByRoom = Object.fromEntries(engineeringRooms.map((room) => [room.id, buildEngineeringInputs(room, designConditions, loadInputs)]));
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
      loadInputs,
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
        <p className="form-note">Room IDs are generated automatically and remain fixed. Enter each conditioned space separately.</p>
        {rooms.map((room, index) => <div className="room-card" key={`${room.id}-${index}`}>
          <div className="room-card-header"><strong>{room.id}</strong>{rooms.length > 1 && <button type="button" className="icon-button" onClick={() => removeRoom(index)}>Remove</button>}</div>
          <div className="input-grid">
            <Input label="Room ID" value={room.id} placeholder="ROOM-1" readOnly />
            <Input label="Room name" value={room.name} onChange={(v) => updateRoom(index, "name", v)} placeholder="Open Office" />
            <Input label="Length" value={room.length} onChange={(v) => updateRoom(index, "length", v)} placeholder="m" type="number" min="0" />
            <Input label="Width" value={room.width} onChange={(v) => updateRoom(index, "width", v)} placeholder="m" type="number" min="0" />
            <Input label="Height" value={room.height} onChange={(v) => updateRoom(index, "height", v)} placeholder="m" type="number" min="0" />
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
          <Input label="Indoor relative humidity" value={indoorRelativeHumidityPercent} onChange={setIndoorRelativeHumidityPercent} placeholder="%" type="number" min="0" max="100" />
        </div>
        <div className="condition-summary">
          {(() => { const condition = designConditionOptions.find((item) => item.id === designConditionId); const selected = condition?.cooling?.db?.[coolingPercentile]; return <><span>{condition?.location}</span><span>Outdoor DB: <b>{selected?.dryBulbC} °C</b></span><span>MCWB: <b>{selected?.meanCoincidentWetBulbC} °C</b></span><span>Indoor: <b>{indoorDryBulbC} °C / {indoorRelativeHumidityPercent}% RH</b></span></>; })()}
        </div>

        <div className="section-heading compact"><h3>Engineering Load Inputs</h3><span>03</span></div>
        <p className="form-note">These are explicit preliminary beta assumptions, not hidden values. Replace them with project-specific construction, solar, occupancy and lighting data before relying on a design result.</p>
        <div className="input-grid">
          <Input label="Wall U-value" value={loadInputs.wallUValue} onChange={(v) => updateLoadInput("wallUValue", v)} placeholder="W/m²K" type="number" min="0" />
          <Input label="Wall CLTD" value={loadInputs.wallCltd} onChange={(v) => updateLoadInput("wallCltd", v)} placeholder="K" type="number" min="0" />
          <Input label="Roof U-value" value={loadInputs.roofUValue} onChange={(v) => updateLoadInput("roofUValue", v)} placeholder="W/m²K" type="number" min="0" />
          <Input label="Roof CLTD" value={loadInputs.roofCltd} onChange={(v) => updateLoadInput("roofCltd", v)} placeholder="K" type="number" min="0" />
          <Input label="Window U-value" value={loadInputs.windowUValue} onChange={(v) => updateLoadInput("windowUValue", v)} placeholder="W/m²K" type="number" min="0" />
          <Input label="Window CLTD" value={loadInputs.windowCltd} onChange={(v) => updateLoadInput("windowCltd", v)} placeholder="K" type="number" min="0" />
          <Input label="Window SHGC" value={loadInputs.windowShgc} onChange={(v) => updateLoadInput("windowShgc", v)} placeholder="0–1" type="number" min="0" max="1" />
          <Input label="Solar irradiance" value={loadInputs.solarIrradiance} onChange={(v) => updateLoadInput("solarIrradiance", v)} placeholder="W/m²" type="number" min="0" />
          <Input label="Sensible heat/person" value={loadInputs.sensibleHeatPerPerson} onChange={(v) => updateLoadInput("sensibleHeatPerPerson", v)} placeholder="W/person" type="number" min="0" />
          <Input label="Latent heat/person" value={loadInputs.latentHeatPerPerson} onChange={(v) => updateLoadInput("latentHeatPerPerson", v)} placeholder="W/person" type="number" min="0" />
          <Input label="Lighting power density" value={loadInputs.lightingPowerDensity} onChange={(v) => updateLoadInput("lightingPowerDensity", v)} placeholder="W/m²" type="number" min="0" />
        </div>

        <div className="section-heading compact"><h3>Load & System Criteria</h3><span>04</span></div>
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
        <div className="card"><div className="section-heading"><h3>Design Conditions</h3><span>05</span></div>
          <div className="stat"><span>Location</span><b>{result.designConditions.outdoor.location}</b></div>
          <div className="stat"><span>Source</span><b>ASHRAE {result.designConditions.outdoor.sourceEdition}</b></div>
          <div className="stat"><span>Cooling basis</span><b>{result.designConditions.selectedCoolingCondition.percentile.replace("percentile", "").replace("04", "0.4%").replace("1", "1%").replace("2", "2%")}</b></div>
          <div className="stat"><span>Outdoor DB / MCWB</span><b>{result.designConditions.selectedCoolingCondition.dryBulbC} / {result.designConditions.selectedCoolingCondition.meanCoincidentWetBulbC} °C</b></div>
          <div className="stat"><span>Indoor DB / RH</span><b>{result.designConditions.indoor.dryBulbC} °C / {result.designConditions.indoor.relativeHumidityPercent}%</b></div>
        </div>

        <div className="card"><div className="section-heading"><h3>Project Cooling Load</h3><span>06</span></div>
          <div className="stat"><span>Conditioned Area</span><b>{result.summary.floorAreaM2.toFixed(2)} m²</b></div>
          <div className="stat"><span>Room Volume</span><b>{result.summary.volumeM3.toFixed(2)} m³</b></div>
          <div className="stat"><span>Total Occupants</span><b>{result.summary.occupants}</b></div>
          <div className="stat"><span>Raw Cooling Load</span><b>{result.loads.totalRawLoadKw.toFixed(2)} kW</b></div>
          <div className="stat"><span>Design Cooling Load</span><b>{result.loads.totalDesignLoadKw.toFixed(2)} kW</b></div>
        </div>

        <div className="card"><div className="section-heading"><h3>Room Load Schedule</h3><span>07</span></div>
          {result.loads.roomResults.map((room) => <div className="stat" key={room.roomId}><span>{room.roomId} · {room.roomName} · {room.geometry.floorAreaM2.toFixed(1)} m²</span><b>Raw {(room.rawLoad.totalW / 1000).toFixed(2)} kW · Design {(room.designLoad.totalW / 1000).toFixed(2)} kW</b></div>)}
        </div>

        <div className="card decision-card"><div className="section-heading"><h3>System Decision</h3><span>08</span></div>
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

function buildEngineeringInputs(room, designConditions, inputs) {
  const outdoor = designConditions.selectedCoolingCondition;
  const indoor = designConditions.indoor;
  const wallArea = Math.max(0, 2 * room.height * (room.length + room.width) - room.windowAreaM2);
  const equipmentWatts = Math.max(0, Number(room.equipmentLoadKw) || 0) * 1000;
  return {
    walls: { area: wallArea, uValue: Number(inputs.wallUValue), cltd: Number(inputs.wallCltd) },
    roof: { area: room.length * room.width, uValue: Number(inputs.roofUValue), cltd: Number(inputs.roofCltd) },
    windows: { area: room.windowAreaM2, uValue: Number(inputs.windowUValue), cltd: Number(inputs.windowCltd), shgc: Number(inputs.windowShgc), solarIrradiance: Number(inputs.solarIrradiance) },
    people: { sensibleHeatPerPerson: Number(inputs.sensibleHeatPerPerson), latentHeatPerPerson: Number(inputs.latentHeatPerPerson) },
    lighting: { powerDensity: Number(inputs.lightingPowerDensity) },
    equipment: equipmentWatts > 0 ? [{ type: "Room equipment load", quantity: 1, sensibleWatts: equipmentWatts, useFactor: 1 }] : [],
    ventilation: { outdoorAirPerPersonLps: 0, outdoorAirPerAreaLpsM2: 0, indoorDryBulbC: indoor.dryBulbC, indoorRelativeHumidityPercent: indoor.relativeHumidityPercent, outdoorDryBulbC: outdoor.dryBulbC, outdoorRelativeHumidityPercent: indoor.relativeHumidityPercent },
    infiltration: { infiltrationAirLps: 0, indoorDryBulbC: indoor.dryBulbC, indoorRelativeHumidityPercent: indoor.relativeHumidityPercent, outdoorDryBulbC: outdoor.dryBulbC, outdoorRelativeHumidityPercent: indoor.relativeHumidityPercent },
  };
}

function Input({ label, value, onChange, placeholder, type = "text", min, max, readOnly = false }) { return <div><label>{label}</label><input type={type} min={min} max={max} value={value} placeholder={placeholder} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)} /></div>; }
function Check({ label, checked, onChange }) { return <label className="check-row"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}</label>; }
