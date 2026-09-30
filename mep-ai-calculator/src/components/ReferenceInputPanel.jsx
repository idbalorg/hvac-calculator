import { getReferenceCompleteness } from "../engineering/reference/referenceDrivenInputs.js";
import { listReferenceRecords, REFERENCE_DATASET_VERSION } from "../engineering/reference/referenceDataset.js";

const LOCATION_OPTIONS = listReferenceRecords("locations");
const ACTIVITY_OPTIONS = listReferenceRecords("occupantActivities");
const VENTILATION_OPTIONS = listReferenceRecords("ventilation");
const CONSTRUCTION_OPTIONS = listReferenceRecords("constructions");
const FENESTRATION_OPTIONS = listReferenceRecords("fenestration");

export const DEFAULT_REFERENCE_SELECTION = {
  locationId: "LAGOS_IKEJA",
  occupancyActivityId: "OFFICE_TYPING",
  ventilationId: "OFFICE_SPACE_62_1_2022",
  constructionId: "ENGINEER_DEFINED_MASONRY_WALL",
  fenestrationId: "ENGINEER_DEFINED_CLEAR_GLASS",
};

const SelectField = ({ label, value, onChange, options, placeholder }) => (
  <div>
    <label>{label}</label>
    <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((item) => <option key={item.id} value={item.id}>{item.label || item.name}</option>)}
    </select>
  </div>
);

export default function ReferenceInputPanel({ selection, onChange, resolved, onApply }) {
  const completeness = getReferenceCompleteness(resolved);
  return <div className="reference-panel">
    <div className="section-heading compact"><h4>Reference-Driven Inputs</h4><span>v{REFERENCE_DATASET_VERSION}</span></div>
    <p className="form-note">Select project/reference records, then apply them to this room. Missing values remain blank for engineer definition.</p>
    <div className="input-grid">
      <SelectField label="Location" value={selection.locationId} onChange={(v) => onChange("locationId", v)} options={LOCATION_OPTIONS} placeholder="Select location" />
      <SelectField label="Occupant activity" value={selection.occupancyActivityId} onChange={(v) => onChange("occupancyActivityId", v)} options={ACTIVITY_OPTIONS} placeholder="Select activity" />
      <SelectField label="Ventilation basis" value={selection.ventilationId} onChange={(v) => onChange("ventilationId", v)} options={VENTILATION_OPTIONS} placeholder="Select ventilation basis" />
      <SelectField label="Wall construction" value={selection.constructionId} onChange={(v) => onChange("constructionId", v)} options={CONSTRUCTION_OPTIONS} placeholder="Select construction" />
      <SelectField label="Fenestration" value={selection.fenestrationId} onChange={(v) => onChange("fenestrationId", v)} options={FENESTRATION_OPTIONS} placeholder="Select glazing" />
    </div>
    <div className="condition-summary">
      <span>Resolved {completeness.completeCount}/{completeness.total}</span>
      <span>Activity: <b>{resolved?.inputs?.people?.activity || "Not selected"}</b></span>
      <span>Ventilation: <b>{resolved?.inputs?.ventilation?.standard || "Not selected"}</b></span>
      <span>Wall U: <b>{resolved?.inputs?.wall?.uValueWm2K ?? "Engineer input"}</b></span>
      <span>Window SHGC: <b>{resolved?.inputs?.windows?.shgc ?? "Engineer input"}</b></span>
    </div>
    <p className="form-note">Sources: {resolved?.references ? Object.values(resolved.references).filter(Boolean).map((r) => r.sourceRef).join(" · ") : "No references selected"}</p>
    <button type="button" className="secondary-button" onClick={onApply}>Apply Reference Inputs</button>
  </div>;
}
