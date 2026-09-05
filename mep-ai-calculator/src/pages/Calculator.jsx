import { useMemo, useState } from "react";
import "../App.css";
import { buildProjectRooms, calculateProjectRoomSummary, createRoom } from "../engineering/project/projectRooms.js";
import { calculateProjectCoolingLoads } from "../engineering/cooling-load/roomLoadEngine.js";
import { recommendHVACSystems } from "../engineering/system/systemDecision.js";
import { buildProjectDesignConditions, listDesignConditions } from "../engineering/project/designConditions.js";
import { createEngineeringInputs, buildEngineeringInputsForRoom, createEquipmentItem, ENGINEERING_INPUT_VERSION } from "../engineering/project/engineeringInputs.js";

const blankRoom = (id = "ROOM-1") => ({ id, name: "", length: "", width: "", height: "", people: "", equipmentLoadKw: "", windowAreaM2: "" });
const designConditionOptions = listDesignConditions();
const DEFAULT_INPUTS = createEngineeringInputs();
const clone = (value) => JSON.parse(JSON.stringify(value));
const toEngineeringRoom = (room) => createRoom({ id: room.id, name: room.name, length: Number(room.length), width: Number(room.width), height: Number(room.height), people: Number(room.people) || 0, equipmentLoadKw: Number(room.equipmentLoadKw) || 0, windowAreaM2: Number(room.windowAreaM2) || 0 });

export default function CoolingLoadCalculator() {
  const [rooms, setRooms] = useState([blankRoom()]);
  const [engineeringByRoom, setEngineeringByRoom] = useState({ "ROOM-1": clone(DEFAULT_INPUTS) });
  const [criteria, setCriteria] = useState({ ventilation: false, ceiling: false, outdoor: false, plant: false });
  const [zoning, setZoning] = useState("medium");
  const [designMarginPercent, setDesignMarginPercent] = useState("10");
  const [designConditionId, setDesignConditionId] = useState("LAGOS_IKEJA_ASHRAE_2021");
  const [coolingPercentile, setCoolingPercentile] = useState("percentile04");
  const [indoorDryBulbC, setIndoorDryBulbC] = useState("24");
  const [indoorRelativeHumidityPercent, setIndoorRelativeHumidityPercent] = useState("50");
  const [outdoorRelativeHumidityPercent, setOutdoorRelativeHumidityPercent] = useState("75");
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
  const addRoom = () => {
    const id = `ROOM-${rooms.length + 1}`;
    setRooms((current) => [...current, blankRoom(id)]);
    setEngineeringByRoom((current) => ({ ...current, [id]: clone(DEFAULT_INPUTS) }));
  };
  const removeRoom = (index) => {
    if (rooms.length === 1) return;
    const removed = rooms[index];
    setRooms((current) => current.filter((_, i) => i !== index));
    setEngineeringByRoom((current) => { const next = { ...current }; delete next[removed.id]; return next; });
  };
  const updateEngineering = (roomId, section, key, value) => setEngineeringByRoom((current) => ({ ...current, [roomId]: { ...current[roomId], [section]: { ...current[roomId][section], [key]: value } } }));
  const updateEquipment = (roomId, index, key, value) => setEngineeringByRoom((current) => { const items = [...(current[roomId]?.equipment?.items || [])]; items[index] = { ...items[index], [key]: value }; return { ...current, [roomId]: { ...current[roomId], equipment: { ...current[roomId].equipment, items } } }; });
  const addEquipment = (roomId) => setEngineeringByRoom((current) => ({ ...current, [roomId]: { ...current[roomId], equipment: { ...current[roomId].equipment, items: [...current[roomId].equipment.items, createEquipmentItem({ name: "New equipment" })] } } }));
  const removeEquipment = (roomId, index) => setEngineeringByRoom((current) => ({ ...current, [roomId]: { ...current[roomId], equipment: { ...current[roomId].equipment, items: current[roomId].equipment.items.filter((_, i) => i !== index) } } }));

  const calculate = () => {
    setError("");
    try {
      const engineeringRooms = rooms.map(toEngineeringRoom);
      const builtRooms = buildProjectRooms(engineeringRooms);
      const projectSummary = calculateProjectRoomSummary(engineeringRooms);
      const designConditions = buildProjectDesignConditions({ outdoorConditionId: designConditionId, coolingPercentile, indoorDryBulbC: Number(indoorDryBulbC), indoorRelativeHumidityPercent: Number(indoorRelativeHumidityPercent), outdoorRelativeHumidityPercent: Number(outdoorRelativeHumidityPercent) });
      const engineering = Object.fromEntries(engineeringRooms.map((room) => [room.id, buildEngineeringInputsForRoom({ room, designConditions, inputs: engineeringByRoom[room.id] })]));
      const margin = Number(designMarginPercent) || 0;
      const loads = calculateProjectCoolingLoads({ rooms: engineeringRooms, engineeringByRoom: engineering, designMarginPercent: margin });
      const decision = recommendHVACSystems({ totalCoolingLoadKw: Math.max(loads.totalDesignLoadKw, 0.001), floorAreaM2: Math.max(projectSummary.floorAreaM2, 0.001), zoneCount: builtRooms.length, ventilationRequired: criteria.ventilation, zoningPriority: zoning, ceilingSpaceLimited: criteria.ceiling, outdoorUnitSpaceLimited: criteria.outdoor, centralPlantAvailable: criteria.plant });
      setResult({ rooms: builtRooms, summary: projectSummary, loads, decision, designConditions, engineering });
    } catch (e) { setResult(null); setError(e.message || "Please check the project inputs."); }
  };

  const saveProject = () => {
    if (!result) return;
    const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]");
    localStorage.setItem("hvac-projects", JSON.stringify([...projects, { rooms, engineeringByRoom, criteria, zoning, designMarginPercent, designConditionId, coolingPercentile, indoorDryBulbC, indoorRelativeHumidityPercent, outdoorRelativeHumidityPercent, result, date: new Date().toISOString(), inputModelVersion: ENGINEERING_INPUT_VERSION }]));
  };

  return <div className="container">
    <div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 12</p><h1 className="title">HVAC Design Calculator</h1><p className="subtitle">Structured project and room engineering inputs connected to the component cooling-load engine.</p></div><span className="version-badge">Input Model {ENGINEERING_INPUT_VERSION}</span></div>
    <div className="grid calculator-grid">
      <div className="card">
        <div className="section-heading"><h3>Project Rooms</h3><span>01</span></div>
        <p className="form-note">Room IDs are generated automatically and remain fixed. Geometry and occupancy belong to each conditioned space.</p>
        {rooms.map((room, index) => <div className="room-card" key={room.id}>
          <div className="room-card-header"><strong>{room.id}</strong>{rooms.length > 1 && <button type="button" className="icon-button" onClick={() => removeRoom(index)}>Remove</button>}</div>
          <div className="input-grid">
            <Input label="Room ID" value={room.id} readOnly /><Input label="Room name" value={room.name} onChange={(v) => updateRoom(index, "name", v)} placeholder="Open Office" />
            <Input label="Length" value={room.length} onChange={(v) => updateRoom(index, "length", v)} placeholder="m" type="number" min="0" /><Input label="Width" value={room.width} onChange={(v) => updateRoom(index, "width", v)} placeholder="m" type="number" min="0" />
            <Input label="Height" value={room.height} onChange={(v) => updateRoom(index, "height", v)} placeholder="m" type="number" min="0" /><Input label="Occupants" value={room.people} onChange={(v) => updateRoom(index, "people", v)} placeholder="people" type="number" min="0" />
            <Input label="Equipment allowance" value={room.equipmentLoadKw} onChange={(v) => updateRoom(index, "equipmentLoadKw", v)} placeholder="kW" type="number" min="0" /><Input label="Window area" value={room.windowAreaM2} onChange={(v) => updateRoom(index, "windowAreaM2", v)} placeholder="m²" type="number" min="0" />
          </div>
          <div className="section-heading compact"><h4>Engineering Inputs</h4><span>Room</span></div>
          <p className="form-note">Values are room-specific. Preliminary values are visible and can be replaced with project/reference data.</p>
          <RoomEngineeringForm roomId={room.id} inputs={engineeringByRoom[room.id]} updateEngineering={updateEngineering} updateEquipment={updateEquipment} addEquipment={addEquipment} removeEquipment={removeEquipment} />
        </div>)}
        <button type="button" className="secondary-button" onClick={addRoom}>+ Add Room</button>

        <div className="section-heading compact"><h3>Project Design Conditions</h3><span>02</span></div>
        <div className="input-grid">
          <div><label>Outdoor design condition</label><select value={designConditionId} onChange={(e) => setDesignConditionId(e.target.value)}>{designConditionOptions.map((condition) => <option key={condition.id} value={condition.id}>{condition.location} · ASHRAE {condition.sourceEdition}</option>)}</select></div>
          <div><label>Cooling design percentile</label><select value={coolingPercentile} onChange={(e) => setCoolingPercentile(e.target.value)}><option value="percentile04">0.4%</option><option value="percentile1">1.0%</option><option value="percentile2">2.0%</option></select></div>
          <Input label="Indoor dry-bulb" value={indoorDryBulbC} onChange={setIndoorDryBulbC} placeholder="°C" type="number" /><Input label="Indoor RH" value={indoorRelativeHumidityPercent} onChange={setIndoorRelativeHumidityPercent} placeholder="%" type="number" min="0" max="100" />
          <Input label="Outdoor RH for psychrometrics" value={outdoorRelativeHumidityPercent} onChange={setOutdoorRelativeHumidityPercent} placeholder="%" type="number" min="0" max="100" />
        </div>
        <div className="condition-summary">{(() => { const condition = designConditionOptions.find((item) => item.id === designConditionId); const selected = condition?.cooling?.db?.[coolingPercentile]; return <><span>{condition?.location}</span><span>Outdoor DB: <b>{selected?.dryBulbC} °C</b></span><span>MCWB: <b>{selected?.meanCoincidentWetBulbC} °C</b></span><span>Outdoor RH: <b>{outdoorRelativeHumidityPercent}%</b></span><span>Indoor: <b>{indoorDryBulbC} °C / {indoorRelativeHumidityPercent}% RH</b></span></>; })()}</div>

        <div className="section-heading compact"><h3>Load & System Criteria</h3><span>03</span></div>
        <div className="input-grid"><Input label="Design margin" value={designMarginPercent} onChange={setDesignMarginPercent} placeholder="%" type="number" min="0" /><div><label>Zoning priority</label><select value={zoning} onChange={(e) => setZoning(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div></div>
        <div className="checks"><Check label="Dedicated ventilation required" checked={criteria.ventilation} onChange={(v) => setCriteria((c) => ({ ...c, ventilation: v }))} /><Check label="Ceiling/service space limited" checked={criteria.ceiling} onChange={(v) => setCriteria((c) => ({ ...c, ceiling: v }))} /><Check label="Outdoor-unit space limited" checked={criteria.outdoor} onChange={(v) => setCriteria((c) => ({ ...c, outdoor: v }))} /><Check label="Central plant available" checked={criteria.plant} onChange={(v) => setCriteria((c) => ({ ...c, plant: v }))} /></div>
        {summary && <div className="project-mini-summary"><span>{summary.roomCount} rooms</span><span>{summary.floorAreaM2.toFixed(1)} m²</span><span>{summary.occupants} occupants</span></div>}
        {error && <p className="error-message">{error}</p>}
        <button onClick={calculate}>Run Engineering Assessment</button>
      </div>

      {result && <div className="results-stack">
        <div className="card"><div className="section-heading"><h3>Design Conditions</h3><span>04</span></div><div className="stat"><span>Location</span><b>{result.designConditions.outdoor.location}</b></div><div className="stat"><span>Source</span><b>ASHRAE {result.designConditions.outdoor.sourceEdition}</b></div><div className="stat"><span>Cooling basis</span><b>{result.designConditions.selectedCoolingCondition.percentile === "percentile04" ? "0.4%" : result.designConditions.selectedCoolingCondition.percentile === "percentile1" ? "1%" : "2%"}</b></div><div className="stat"><span>Outdoor DB / MCWB</span><b>{result.designConditions.selectedCoolingCondition.dryBulbC} / {result.designConditions.selectedCoolingCondition.meanCoincidentWetBulbC} °C</b></div><div className="stat"><span>Indoor DB / RH</span><b>{result.designConditions.indoor.dryBulbC} °C / {result.designConditions.indoor.relativeHumidityPercent}%</b></div><div className="stat"><span>Outdoor RH input</span><b>{result.designConditions.outdoor.relativeHumidityPercent}%</b></div></div>
        <div className="card"><div className="section-heading"><h3>Project Cooling Load</h3><span>05</span></div><div className="stat"><span>Conditioned Area</span><b>{result.summary.floorAreaM2.toFixed(2)} m²</b></div><div className="stat"><span>Room Volume</span><b>{result.summary.volumeM3.toFixed(2)} m³</b></div><div className="stat"><span>Total Occupants</span><b>{result.summary.occupants}</b></div><div className="stat"><span>Raw Cooling Load</span><b>{result.loads.totalRawLoadKw.toFixed(2)} kW</b></div><div className="stat"><span>Design Cooling Load</span><b>{result.loads.totalDesignLoadKw.toFixed(2)} kW</b></div></div>
        <div className="card"><div className="section-heading"><h3>Room Load Schedule</h3><span>06</span></div>{result.loads.roomResults.map((room) => <div className="stat" key={room.roomId}><span>{room.roomId} · {room.roomName} · {room.geometry.floorAreaM2.toFixed(1)} m²</span><b>Raw {(room.rawLoad.totalW / 1000).toFixed(2)} kW · Design {(room.designLoad.totalW / 1000).toFixed(2)} kW</b></div>)}</div>
        <div className="card decision-card"><div className="section-heading"><h3>System Decision</h3><span>07</span></div><div className="recommendation"><span>Recommended system</span><strong>{result.decision.recommendedLabel}</strong><small>{result.decision.confidence === "RELATIVE_HIGH" ? "Strongest rule-based option" : "Engineering review required"}</small></div><div className="ranking-list">{result.decision.options.map((option, index) => <div className={`ranking-row ${index === 0 ? "selected" : ""}`} key={option.systemType}><span className="rank">{index + 1}</span><div><b>{option.label}</b><small>{option.reasons[0] || option.warnings[0] || "Viable for further evaluation"}</small></div><strong>{option.score}</strong></div>)}</div><p className="engineering-note">{result.decision.engineeringNote}</p><button className="secondary-button" onClick={saveProject}>Save Project</button></div>
      </div>}
    </div>
  </div>;
}

function RoomEngineeringForm({ roomId, inputs, updateEngineering, updateEquipment, addEquipment, removeEquipment }) {
  const safe = inputs || DEFAULT_INPUTS;
  return <div>
    <div className="input-grid">
      <Input label="Wall U-value" value={safe.wall.uValueWm2K} onChange={(v) => updateEngineering(roomId, "wall", "uValueWm2K", v)} type="number" min="0" placeholder="W/m²K" /><Input label="Wall CLTD" value={safe.wall.cltdK} onChange={(v) => updateEngineering(roomId, "wall", "cltdK", v)} type="number" min="0" placeholder="K" />
      <Input label="Roof U-value" value={safe.roof.uValueWm2K} onChange={(v) => updateEngineering(roomId, "roof", "uValueWm2K", v)} type="number" min="0" placeholder="W/m²K" /><Input label="Roof CLTD" value={safe.roof.cltdK} onChange={(v) => updateEngineering(roomId, "roof", "cltdK", v)} type="number" min="0" placeholder="K" />
      <Input label="Window U-value" value={safe.windows.uValueWm2K} onChange={(v) => updateEngineering(roomId, "windows", "uValueWm2K", v)} type="number" min="0" placeholder="W/m²K" /><Input label="Window CLTD" value={safe.windows.cltdK} onChange={(v) => updateEngineering(roomId, "windows", "cltdK", v)} type="number" min="0" placeholder="K" />
      <Input label="Window SHGC" value={safe.windows.shgc} onChange={(v) => updateEngineering(roomId, "windows", "shgc", v)} type="number" min="0" max="1" placeholder="0–1" /><Input label="Solar irradiance" value={safe.windows.solarIrradianceWm2} onChange={(v) => updateEngineering(roomId, "windows", "solarIrradianceWm2", v)} type="number" min="0" placeholder="W/m²" />
      <Input label="Window shading factor" value={safe.windows.shadingFactor} onChange={(v) => updateEngineering(roomId, "windows", "shadingFactor", v)} type="number" min="0" max="1" placeholder="0–1" /><Input label="Wall orientation" value={safe.wall.orientation} onChange={(v) => updateEngineering(roomId, "wall", "orientation", v)} placeholder="N / S / E / W / all" />
      <Input label="Wall construction" value={safe.wall.construction} onChange={(v) => updateEngineering(roomId, "wall", "construction", v)} placeholder="Construction type" /><Input label="Glazing description" value={safe.windows.glazing} onChange={(v) => updateEngineering(roomId, "windows", "glazing", v)} placeholder="Glazing type" />
      <Input label="Sensible heat/person" value={safe.people.sensibleHeatWPerPerson} onChange={(v) => updateEngineering(roomId, "people", "sensibleHeatWPerPerson", v)} type="number" min="0" placeholder="W/person" /><Input label="Latent heat/person" value={safe.people.latentHeatWPerPerson} onChange={(v) => updateEngineering(roomId, "people", "latentHeatWPerPerson", v)} type="number" min="0" placeholder="W/person" />
      <Input label="People diversity factor" value={safe.people.diversityFactor} onChange={(v) => updateEngineering(roomId, "people", "diversityFactor", v)} type="number" min="0" max="1" placeholder="0–1" /><Input label="Activity description" value={safe.people.activity} onChange={(v) => updateEngineering(roomId, "people", "activity", v)} placeholder="Office / retail / etc." />
      <Input label="Lighting power density" value={safe.lighting.powerDensityWm2} onChange={(v) => updateEngineering(roomId, "lighting", "powerDensityWm2", v)} type="number" min="0" placeholder="W/m²" /><Input label="Lighting use factor" value={safe.lighting.useFactor} onChange={(v) => updateEngineering(roomId, "lighting", "useFactor", v)} type="number" min="0" max="1" placeholder="0–1" />
      <Input label="Ballast factor" value={safe.lighting.ballastFactor} onChange={(v) => updateEngineering(roomId, "lighting", "ballastFactor", v)} type="number" min="0" placeholder="factor" />
    </div>
    <div className="section-heading compact"><h4>Ventilation</h4><span>Room</span></div>
    <div className="checks"><Check label="Include mechanical ventilation load" checked={safe.ventilation.enabled} onChange={(v) => updateEngineering(roomId, "ventilation", "enabled", v)} /></div>
    <div className="input-grid"><Input label="Ventilation standard/basis" value={safe.ventilation.standard} onChange={(v) => updateEngineering(roomId, "ventilation", "standard", v)} placeholder="Reference" /><Input label="Zone category" value={safe.ventilation.zoneCategory} onChange={(v) => updateEngineering(roomId, "ventilation", "zoneCategory", v)} placeholder="Category" /><Input label="Outdoor air/person" value={safe.ventilation.outdoorAirPerPersonLps} onChange={(v) => updateEngineering(roomId, "ventilation", "outdoorAirPerPersonLps", v)} type="number" min="0" placeholder="L/s-person" /><Input label="Outdoor air/area" value={safe.ventilation.outdoorAirPerAreaLpsM2} onChange={(v) => updateEngineering(roomId, "ventilation", "outdoorAirPerAreaLpsM2", v)} type="number" min="0" placeholder="L/s-m²" /><Input label="Ventilation effectiveness" value={safe.ventilation.effectiveness} onChange={(v) => updateEngineering(roomId, "ventilation", "effectiveness", v)} type="number" min="0.01" placeholder="factor" /></div>
    <div className="section-heading compact"><h4>Infiltration</h4><span>Room</span></div>
    <div className="checks"><Check label="Include infiltration load" checked={safe.infiltration.enabled} onChange={(v) => updateEngineering(roomId, "infiltration", "enabled", v)} /></div>
    <div className="input-grid"><div><label>Infiltration method</label><select value={safe.infiltration.method} onChange={(e) => updateEngineering(roomId, "infiltration", "method", e.target.value)}><option value="ACH">Air changes per hour</option><option value="AIRFLOW">Direct airflow</option></select></div><Input label="Infiltration ACH" value={safe.infiltration.airChangesPerHour} onChange={(v) => updateEngineering(roomId, "infiltration", "airChangesPerHour", v)} type="number" min="0" placeholder="ACH" /><Input label="Infiltration airflow" value={safe.infiltration.airflowLps} onChange={(v) => updateEngineering(roomId, "infiltration", "airflowLps", v)} type="number" min="0" placeholder="L/s" /></div>
    <div className="section-heading compact"><h4>Equipment Schedule</h4><button type="button" className="secondary-button" onClick={() => addEquipment(roomId)}>+ Add Equipment</button></div>
    {(safe.equipment.items || []).length === 0 && <p className="form-note">No item schedule. The room equipment allowance above is used when non-zero.</p>}
    {(safe.equipment.items || []).map((item, index) => <div className="room-card" key={item.id || index}><div className="room-card-header"><strong>{item.name || `Equipment ${index + 1}`}</strong><button type="button" className="icon-button" onClick={() => removeEquipment(roomId, index)}>Remove</button></div><div className="input-grid"><Input label="Item" value={item.name} onChange={(v) => updateEquipment(roomId, index, "name", v)} /><Input label="Quantity" value={item.quantity} onChange={(v) => updateEquipment(roomId, index, "quantity", v)} type="number" min="0" /><Input label="Sensible watts/item" value={item.sensibleWatts} onChange={(v) => updateEquipment(roomId, index, "sensibleWatts", v)} type="number" min="0" /><Input label="Latent watts/item" value={item.latentWatts} onChange={(v) => updateEquipment(roomId, index, "latentWatts", v)} type="number" min="0" /><Input label="Use factor" value={item.useFactor} onChange={(v) => updateEquipment(roomId, index, "useFactor", v)} type="number" min="0" max="1" /></div></div>)}
  </div>;
}

function Input({ label, value, onChange, placeholder, type = "text", min, max, readOnly = false }) { return <div><label>{label}</label><input type={type} min={min} max={max} value={value ?? ""} placeholder={placeholder} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)} /></div>; }
function Check({ label, checked, onChange }) { return <label className="check-row"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}</label>; }
