import { useMemo, useState } from "react";
import "../App.css";
import { buildFinalDesignPackage, summarizeFinalDesignPackage } from "../engineering/report/finalDesignPackage.js";

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function FinalDesignPackage() {
  const saved = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("hvac-projects") || "[]").at(-1) || null; } catch { return null; }
  }, []);
  const [packageResult, setPackageResult] = useState(null);
  const [error, setError] = useState("");
  const [oversize, setOversize] = useState("15");
  const [capacityMargin, setCapacityMargin] = useState("0");
  const [airflowRatio, setAirflowRatio] = useState("1");
  const [espRatio, setEspRatio] = useState("1");

  const buildPackage = () => {
    setError("");
    try {
      if (!saved?.rooms?.length) throw new Error("Create and save a project with at least one room first.");
      const loadResults = saved.result?.loads?.roomResults || [];
      const airsideResults = saved.result?.airside?.roomResults || [];
      if (!loadResults.length) throw new Error("Run the main calculator first so room cooling loads are available.");
      if (!airsideResults.length) throw new Error("Run Stage 13 Psychrometrics & Airside for the project first.");

      const dx = saved.result?.dxSystem;
      const airDistribution = saved.result?.airDistribution;
      const airBalance = saved.result?.airBalanceSystem;
      const commissioning = saved.result?.commissioning;

      const equipment = dx?.selection?.selected ? [{
        equipmentId: dx.selection.selected.indoorUnit.id || `${dx.roomId || "ROOM"}-INDOOR`,
        systemId: airBalance?.systemSummary?.systemId || "SYSTEM-01",
        type: dx.selection.selected.indoorUnit.type || "SPLIT_DX",
        manufacturer: dx.selection.selected.indoorUnit.manufacturer,
        model: dx.selection.selected.indoorUnit.model,
        refrigerant: dx.selection.selected.indoorUnit.refrigerant,
        capacityKw: n(dx.coverage?.selectedCapacityKW, dx.selection.selected.indoorUnit.coolingCapacityKw),
        requiredCapacityKw: n(dx.capacityBasis?.sizing?.requiredCapacityKW),
        designAirflowCfm: n(dx.requiredAirflowCfm),
        selectedAirflowCfm: n(dx.selection.selected.indoorUnit.airflowCfm),
        requiredEspPa: n(airDistribution?.integrated?.esp?.requiredFanESP_Pa, 0),
        selectedEspPa: n(dx.selection.selected.indoorUnit.availableEspPa, 0),
      }] : [];

      const branches = airDistribution?.integrated?.distribution?.branches || [];
      const ducts = branches.flatMap((branch) => (branch.segments || []).map((segment, index) => ({
        ductId: `${branch.id || "B"}-${index + 1}`,
        systemId: "SYSTEM-01",
        sectionType: "BRANCH",
        airflowCfm: n(segment.volumeFlowM3s) * 2118.88,
        widthM: n(segment.widthM, airDistribution?.inputs?.ductWidthM),
        heightM: n(segment.heightM),
        velocityMps: n(segment.velocityMps, segment.velocityMps || airDistribution?.inputs?.targetVelocityMps),
        pressureLossPa: n(segment.pressureLossPa),
      })));

      const generated = buildFinalDesignPackage({
        project: saved,
        rooms: saved.rooms,
        loadResults,
        airsideResults,
        equipment,
        ducts,
        systemSummary: airBalance?.systemSummary || null,
        criteria: {
          minimumCapacityMarginPercent: n(capacityMargin),
          maximumCapacityOversizePercent: oversize === "" ? null : n(oversize),
          minimumAirflowRatio: n(airflowRatio, 1),
          minimumEspRatio: n(espRatio, 1),
          ventilationRequired: saved.result?.loads?.ventilationRequired === true,
          commissioningRequired: Boolean(commissioning),
          measuredDataAvailable: Boolean(saved.result?.airBalanceSystem?.measuredData),
        },
        generatedAt: new Date().toISOString(),
      });

      const payload = { ...generated, sourceStages: { loads: true, airside: true, dxSystem: Boolean(dx), airDistribution: Boolean(airDistribution), airBalance: Boolean(airBalance), commissioning: Boolean(commissioning) } };
      const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]");
      if (projects.length) {
        const current = projects.at(-1);
        current.result = { ...current.result, finalDesignPackage: payload };
        localStorage.setItem("hvac-projects", JSON.stringify(projects));
      }
      setPackageResult(payload);
    } catch (e) {
      setPackageResult(null);
      setError(e.message || "Unable to build the final design package.");
    }
  };

  const exportJson = () => {
    if (!packageResult) return;
    const blob = new Blob([JSON.stringify(packageResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${saved?.name || "hvac-project"}-final-design-package.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const summary = packageResult ? summarizeFinalDesignPackage(packageResult) : null;

  return <div className="container final-design-package">
    <div className="page-header"><div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 18</p><h1 className="title">Final Design Package</h1><p className="subtitle">Structured engineering schedules, standards basis and verification summary.</p></div><span className="version-badge">Package 18.0</span></div>

    <div className="card package-controls no-print">
      <div className="section-heading"><h3>Package Criteria</h3><span>01</span></div>
      {!saved && <p className="form-note">Create and save a project first.</p>}
      <div className="input-grid">
        <Input label="Minimum capacity margin" value={capacityMargin} onChange={setCapacityMargin} placeholder="%" />
        <Input label="Maximum capacity oversize" value={oversize} onChange={setOversize} placeholder="%" />
        <Input label="Minimum airflow ratio" value={airflowRatio} onChange={setAirflowRatio} />
        <Input label="Minimum ESP ratio" value={espRatio} onChange={setEspRatio} />
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="button-row"><button onClick={buildPackage} disabled={!saved}>Generate Final Design Package</button>{packageResult && <button className="secondary-button" onClick={exportJson}>Export JSON</button>} {packageResult && <button className="secondary-button" onClick={() => window.print()}>Print / Save PDF</button>}</div>
      <p className="form-note">The package uses the saved outputs from the preceding workflow stages. Missing upstream outputs are not silently invented.</p>
    </div>

    {packageResult && <>
      <div className="card print-section">
        <div className="section-heading"><h3>Package Summary</h3><span>01</span></div>
        <div className="stat-grid">
          <Stat label="Validation" value={summary.validationPassed ? "PASS" : "FAIL"} />
          <Stat label="Rooms" value={String(summary.roomCount)} />
          <Stat label="Equipment" value={String(summary.equipmentCount)} />
          <Stat label="Duct sections" value={String(summary.ductCount)} />
          <Stat label="Cooling load" value={`${n(summary.totalCoolingLoadKw).toFixed(2)} kW`} />
          <Stat label="Supply airflow" value={`${n(summary.totalSupplyAirflowCfm).toFixed(0)} CFM`} />
          <Stat label="Installed capacity" value={`${n(summary.totalInstalledCapacityKw).toFixed(2)} kW`} />
          <Stat label="Construction ready" value={summary.constructionReady ? "YES" : "NO"} />
        </div>
      </div>

      <div className="card print-section">
        <div className="section-heading"><h3>Engineering Standards & Traceability</h3><span>02</span></div>
        <p className="form-note">Basis recorded as: <b>{packageResult.standardsTraceability.methodology}</b></p>
        <div className="table-wrap"><table><thead><tr><th>ID</th><th>Engineering input</th><th>Method</th><th>Standard / reference</th><th>Verification</th></tr></thead><tbody>
          {packageResult.standardsTraceability.traceability.map((row) => <tr key={row.id}><td>{row.id}</td><td>{row.input}</td><td>{row.method}</td><td>{row.reference}</td><td>{row.verification}</td></tr>)}
        </tbody></table></div>
        <p className="engineering-note"><b>Traceability boundary:</b> {packageResult.standardsTraceability.disclaimer}</p>
      </div>

      <ScheduleTable title="Room Schedule" number="03" columns={["Room", "Area", "Sensible", "Latent", "Total", "SHR", "Supply Air"]} rows={packageResult.report.schedules.rooms.map((r) => [r.roomId, `${n(r.areaM2).toFixed(1)} m²`, `${n(r.sensibleLoadKw).toFixed(2)} kW`, `${n(r.latentLoadKw).toFixed(2)} kW`, `${n(r.totalLoadKw).toFixed(2)} kW`, n(r.sensibleHeatRatio).toFixed(2), `${n(r.supplyAirflowCfm).toFixed(0)} CFM`])} />
      <ScheduleTable title="Equipment Schedule" number="04" columns={["Equipment", "System", "Type", "Capacity", "Airflow", "ESP"]} rows={packageResult.report.schedules.equipment.map((e) => [e.equipmentId, e.systemId, e.type, `${n(e.capacityKw).toFixed(2)} kW`, `${n(e.selectedAirflowCfm).toFixed(0)} CFM`, `${n(e.selectedEspPa).toFixed(0)} Pa`])} />
      <ScheduleTable title="Duct Schedule" number="05" columns={["Duct", "System", "Type", "Airflow", "Size", "Velocity", "Loss"]} rows={packageResult.report.schedules.ducts.map((d) => [d.ductId, d.systemId, d.sectionType, `${n(d.airflowCfm).toFixed(0)} CFM`, `${n(d.widthM).toFixed(2)} × ${n(d.heightM).toFixed(2)} m`, `${n(d.velocityMps).toFixed(1)} m/s`, `${n(d.pressureLossPa).toFixed(1)} Pa`])} />

      <div className="card print-section">
        <div className="section-heading"><h3>Engineering Validation</h3><span>06</span></div>
        <Stat label="Overall status" value={packageResult.report.validation.passed ? "PASS" : "FAIL"} />
        {packageResult.report.validation.equipmentChecks.map((check) => <div className="check-row" key={check.equipmentId}><span>{check.equipmentId}</span><span>Capacity: {check.capacity.status}</span><span>Airflow: {check.airflow.status}</span><b>ESP: {check.esp.status}</b></div>)}
        <p className="engineering-note"><b>Engineering boundary:</b> this package is a structured design and review deliverable. It does not make the design construction-ready automatically. Final verification requires project-specific criteria, detailed drawings, manufacturer-certified data, coordination, TAB/commissioning measurements and applicable code review.</p>
      </div>
    </>}
  </div>;
}

function Input({ label, value, onChange, placeholder }) { return <div><label>{label}</label><input type="number" min="0" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>; }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><b>{value}</b></div>; }
function ScheduleTable({ title, number, columns, rows }) { return <div className="card print-section"><div className="section-heading"><h3>{title}</h3><span>{number}</span></div>{rows.length ? <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div> : <p className="form-note">Not applicable for the selected system / distribution arrangement.</p>}</div>; }
