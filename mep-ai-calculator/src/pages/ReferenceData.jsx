import { useMemo, useState } from "react";
import "../App.css";
import {
  REFERENCE_DATASET_VERSION,
  listReferenceRecords,
  getReferenceRecord,
  buildReferenceSelection,
} from "../engineering/reference/referenceDataset.js";

const sections = [
  ["locations", "Locations"],
  ["occupantActivities", "Occupant Activity"],
  ["ventilation", "Ventilation"],
  ["constructions", "Construction"],
  ["fenestration", "Fenestration"],
];

export default function ReferenceData() {
  const [category, setCategory] = useState("ventilation");
  const records = useMemo(() => listReferenceRecords(category), [category]);
  const [selectedId, setSelectedId] = useState(records[0]?.id || "");
  const selected = selectedId ? getReferenceRecord(category, selectedId) : null;

  const changeCategory = (next) => {
    setCategory(next);
    setSelectedId(listReferenceRecords(next)[0]?.id || "");
  };

  const demoSelection = buildReferenceSelection({
    locationId: "LAGOS_IKEJA",
    occupancyActivityId: "OFFICE_TYPING",
    ventilationId: "OFFICE_SPACE_62_1_2022",
  });

  return <div className="container">
    <div className="page-header">
      <div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 27</p><h1 className="title">Engineering Reference Data</h1><p className="subtitle">Versioned reference records separated from calculation logic, with source provenance and engineer verification flags.</p></div>
      <span className="version-badge">Dataset {REFERENCE_DATASET_VERSION}</span>
    </div>

    <div className="grid">
      <div className="card">
        <div className="section-heading"><h3>Reference Categories</h3><span>01</span></div>
        {sections.map(([id, label]) => <button key={id} type="button" className={category === id ? "" : "secondary-button"} onClick={() => changeCategory(id)} style={{ width: "100%", marginBottom: "8px" }}>{label}</button>)}
      </div>

      <div className="card">
        <div className="section-heading"><h3>{sections.find(([id]) => id === category)?.[1]}</h3><span>02</span></div>
        <div className="input-grid">
          <div><label>Reference record</label><select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>{records.map((item) => <option key={item.id} value={item.id}>{item.label || item.name || item.id}</option>)}</select></div>
        </div>
        {selected && <div className="results-stack" style={{ marginTop: "16px" }}>
          <div className="stat"><span>ID</span><b>{selected.id}</b></div>
          <div className="stat"><span>Source reference</span><b>{selected.sourceRef}</b></div>
          <div className="stat"><span>Verification</span><b>{selected.verificationRequired ? "Required" : "Not required"}</b></div>
          {Object.entries(selected).filter(([key]) => !["id", "sourceRef", "verificationRequired"].includes(key)).map(([key, value]) => <div className="stat" key={key}><span>{key}</span><b>{typeof value === "object" ? JSON.stringify(value) : String(value)}</b></div>)}
        </div>}
      </div>

      <div className="card">
        <div className="section-heading"><h3>Selection Model</h3><span>03</span></div>
        <p className="form-note">The same reference records can be resolved by the calculator before calculation. Sourced values retain their provenance; engineer-defined starter values remain explicitly unverified.</p>
        <div className="stat"><span>Location</span><b>{demoSelection.location.name} · {demoSelection.location.designConditionId}</b></div>
        <div className="stat"><span>Occupant activity</span><b>{demoSelection.occupantActivity.label} · {demoSelection.occupantActivity.met} met</b></div>
        <div className="stat"><span>Ventilation basis</span><b>{demoSelection.ventilation.label} · {demoSelection.ventilation.peopleOutdoorAirCfmPerPerson} cfm/person + {demoSelection.ventilation.areaOutdoorAirCfmPerFt2} cfm/ft²</b></div>
        <div className="stat"><span>Provenance</span><b>{demoSelection.ventilation.sourceRef}</b></div>
      </div>
    </div>

    <div className="card" style={{ marginTop: "16px" }}>
      <div className="section-heading"><h3>Engineering Boundary</h3><span>04</span></div>
      <p className="form-note">This dataset is a controlled reference layer, not a compliance engine. Project-specific adopted codes, licensed tables, manufacturer data, site conditions and engineer judgement remain authoritative. Missing construction and fenestration values are intentionally null rather than invented.</p>
    </div>
  </div>;
}
