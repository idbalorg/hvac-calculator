import { useState } from "react";
import "../App.css";
import { recommendHVACSystems } from "../engineering/system/systemDecision.js";

export default function CoolingLoadCalculator() {
  const [fields, setFields] = useState({ length: "", width: "", height: "", people: "", equipment: "", windowArea: "", zones: 1, zoning: "medium" });
  const [criteria, setCriteria] = useState({ ventilation: false, ceiling: false, outdoor: false, plant: false });
  const [unitSystem, setUnitSystem] = useState("metric");
  const [result, setResult] = useState(null);
  const setField = (key, value) => setFields((current) => ({ ...current, [key]: value }));
  const setCriterion = (key, value) => setCriteria((current) => ({ ...current, [key]: value }));
  const toMeters = (value) => unitSystem === "imperial" ? Number(value) * 0.3048 : Number(value);
  const toWatts = (value) => unitSystem === "imperial" ? Number(value) * 0.293 : Number(value);

  const calculate = () => {
    const L = toMeters(fields.length) || 0, W = toMeters(fields.width) || 0, H = toMeters(fields.height) || 0;
    const floorArea = L * W, wallArea = 2 * H * (L + W);
    const wallLoad = wallArea * 1.5 * 10, roofLoad = floorArea * 0.8 * 15;
    const areaLoad = floorArea * 140, peopleLoad = (Number(fields.people) || 0) * 120;
    const equipmentLoad = toWatts(fields.equipment) || 0;
    const windowLoad = (unitSystem === "imperial" ? Number(fields.windowArea) * 0.092 : Number(fields.windowArea)) * 180;
    const totalW = wallLoad + roofLoad + areaLoad + peopleLoad + equipmentLoad + windowLoad;
    const kW = totalW / 1000;
    const decision = recommendHVACSystems({
      totalCoolingLoadKw: Math.max(kW, 0.001), floorAreaM2: Math.max(floorArea, 0.001),
      zoneCount: Math.max(1, Number.parseInt(fields.zones, 10) || 1), ventilationRequired: criteria.ventilation,
      zoningPriority: fields.zoning, ceilingSpaceLimited: criteria.ceiling,
      outdoorUnitSpaceLimited: criteria.outdoor, centralPlantAvailable: criteria.plant,
    });
    setResult({ floorArea, kW, tons: kW / 3.516, btu: totalW * 3.412, decision });
  };

  const saveProject = () => {
    if (!result) return;
    const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]");
    localStorage.setItem("hvac-projects", JSON.stringify([...projects, { fields, criteria, unitSystem, result, date: new Date().toISOString() }]));
  };

  return <div className="container">
    <div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW</p><h1 className="title">HVAC Design Calculator</h1><p className="subtitle">Cooling-load screening with rule-based HVAC system selection.</p></div><span className="version-badge">Engineering Core v2</span></div>
    <div className="grid calculator-grid">
      <div className="card">
        <div className="section-heading"><h3>Project Inputs</h3><span>01</span></div>
        <label>Unit system</label><select value={unitSystem} onChange={(e) => setUnitSystem(e.target.value)}><option value="metric">Metric (m, W)</option><option value="imperial">Imperial (ft, BTU/hr)</option></select>
        <div className="input-grid"><Input label="Length" value={fields.length} onChange={(v) => setField("length", v)} placeholder={unitSystem === "metric" ? "m" : "ft"} /><Input label="Width" value={fields.width} onChange={(v) => setField("width", v)} placeholder={unitSystem === "metric" ? "m" : "ft"} /><Input label="Height" value={fields.height} onChange={(v) => setField("height", v)} placeholder={unitSystem === "metric" ? "m" : "ft"} /><Input label="Occupants" type="number" value={fields.people} onChange={(v) => setField("people", v)} placeholder="People" /></div>
        <Input label="Equipment load" value={fields.equipment} onChange={(v) => setField("equipment", v)} placeholder={unitSystem === "metric" ? "W" : "BTU/hr"} />
        <Input label="Window area" value={fields.windowArea} onChange={(v) => setField("windowArea", v)} placeholder={unitSystem === "metric" ? "m²" : "ft²"} />
        <div className="section-heading compact"><h3>System Selection Criteria</h3><span>02</span></div>
        <div className="input-grid"><Input label="Number of zones" type="number" min="1" value={fields.zones} onChange={(v) => setField("zones", v)} /><div><label>Zoning priority</label><select value={fields.zoning} onChange={(e) => setField("zoning", e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div></div>
        <div className="checks"><Check label="Dedicated ventilation required" checked={criteria.ventilation} onChange={(v) => setCriterion("ventilation", v)} /><Check label="Ceiling/service space limited" checked={criteria.ceiling} onChange={(v) => setCriterion("ceiling", v)} /><Check label="Outdoor-unit space limited" checked={criteria.outdoor} onChange={(v) => setCriterion("outdoor", v)} /><Check label="Central plant available" checked={criteria.plant} onChange={(v) => setCriterion("plant", v)} /></div>
        <button onClick={calculate}>Run Engineering Assessment</button>
      </div>

      {result && <div className="results-stack">
        <div className="card"><div className="section-heading"><h3>Cooling Load Summary</h3><span>03</span></div><div className="stat"><span>Floor Area</span><b>{result.floorArea.toFixed(2)} m²</b></div><div className="stat"><span>Total Load</span><b>{unitSystem === "metric" ? `${result.kW.toFixed(2)} kW` : `${result.btu.toFixed(0)} BTU/hr`}</b></div><div className="stat"><span>Cooling Capacity</span><b>{result.tons.toFixed(2)} TR</b></div></div>
        <div className="card decision-card"><div className="section-heading"><h3>System Decision</h3><span>04</span></div><div className="recommendation"><span>Recommended system</span><strong>{result.decision.recommendedLabel}</strong><small>{result.decision.confidence === "RELATIVE_HIGH" ? "Strongest rule-based option" : "Engineering review required"}</small></div><div className="ranking-list">{result.decision.options.map((option, index) => <div className={`ranking-row ${index === 0 ? "selected" : ""}`} key={option.systemType}><span className="rank">{index + 1}</span><div><b>{option.label}</b><small>{option.reasons[0] || option.warnings[0] || "Viable for further evaluation"}</small></div><strong>{option.score}</strong></div>)}</div><p className="engineering-note">{result.decision.engineeringNote}</p><button className="secondary-button" onClick={saveProject}>Save Project</button></div>
      </div>}
    </div>
  </div>;
}

function Input({ label, value, onChange, placeholder, type = "text", min }) { return <div><label>{label}</label><input type={type} min={min} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>; }
function Check({ label, checked, onChange }) { return <label className="check-row"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}</label>; }
