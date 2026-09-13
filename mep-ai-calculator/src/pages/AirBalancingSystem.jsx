import { useMemo, useState } from "react";
import "../App.css";
import { integrateAirBalancingAndSystem } from "../engineering/airside/airBalanceSystemIntegration.js";
import { resolveAirDistributionContext } from "../engineering/airside/airDistributionContext.js";

const DEFAULTS = {
  tolerance: 10,
  capacityMargin: 10,
  espSafety: 10,
  maxOversize: 20,
  critical: 180,
  terminal: 30,
  coil: 80,
  filter: 40,
  damper: 20,
  other: 10,
  selectedCapacity: 9,
  selectedAirflow: 800,
  selectedEsp: 440,
};

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function AirBalancingSystem() {
  const saved = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("hvac-projects") || "[]").at(-1) || null; } catch { return null; }
  }, []);

  const rooms = saved?.rooms || [];
  const loadResults = saved?.result?.loads?.roomResults || [];
  const distribution = saved?.result?.airDistribution;
  const systemType = distribution?.systemType || saved?.result?.decision?.recommendedSystem || "SPLIT_DX";
  const distributionType = distribution?.distributionType || resolveAirDistributionContext({ systemType }).distributionType;
  const context = resolveAirDistributionContext({ systemType, distributionType });
  const isDirectDischarge = !context.ductRequired;

  const [roomId, setRoomId] = useState(rooms[0]?.id || loadResults[0]?.roomId || "");
  const [tolerance, setTolerance] = useState(String(DEFAULTS.tolerance));
  const [measured, setMeasured] = useState({});
  const [capacityMargin, setCapacityMargin] = useState(String(DEFAULTS.capacityMargin));
  const [espSafety, setEspSafety] = useState(String(DEFAULTS.espSafety));
  const [maxOversize, setMaxOversize] = useState(String(DEFAULTS.maxOversize));
  const [selectedCapacity, setSelectedCapacity] = useState(String(DEFAULTS.selectedCapacity));
  const [selectedAirflow, setSelectedAirflow] = useState(String(DEFAULTS.selectedAirflow));
  const [selectedEsp, setSelectedEsp] = useState(String(DEFAULTS.selectedEsp));
  const [pressure, setPressure] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const roomResult = loadResults.find((item) => item.roomId === roomId) || loadResults[0];
  const activeRoomId = roomResult?.roomId || roomId;
  const airside = saved?.result?.airside?.roomResults?.find?.((item) => item.roomId === activeRoomId);
  const dx = saved?.result?.dxSystem?.roomId === activeRoomId ? saved.result.dxSystem : null;
  const designAirflowCfm = n(airside?.airflow?.airflowM3s) * 2118.88;
  const defaultMeasured = designAirflowCfm || 400;

  const save = (payload) => {
    const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]");
    if (projects.length) {
      const current = projects.at(-1);
      current.result = { ...current.result, airBalanceSystem: payload };
      localStorage.setItem("hvac-projects", JSON.stringify(projects));
    }
  };

  const run = () => {
    setError("");
    setResult(null);
    try {
      if (!roomResult) throw new Error("Save a calculated project first.");
      if (!airside) throw new Error("Run Stage 13 Psychrometrics & Airside for this room first.");

      const selectedIndoor = dx?.selection?.selected?.indoorUnit || null;

      if (isDirectDischarge) {
        const requiredCapacityKw = n(roomResult.designLoadW) / 1000;
        const selectedCapacityKw = n(selectedIndoor?.coolingCapacityKw, 0);
        const selectedAirflowCfm = n(selectedIndoor?.airflowCfm, 0);
        const capacityPass = selectedCapacityKw > 0 && selectedCapacityKw >= requiredCapacityKw;
        const airflowAvailable = selectedAirflowCfm > 0;
        const airflowPass = airflowAvailable ? selectedAirflowCfm >= designAirflowCfm : null;
        const systemPass = capacityPass && (airflowPass === null || airflowPass);
        const payload = {
          roomId: activeRoomId,
          systemType,
          distributionType,
          applicability: "DIRECT_DISCHARGE",
          requirements: {
            designCapacityKw: requiredCapacityKw,
            supplyAirflowCfm: designAirflowCfm,
            requiredFanEspPa: null,
            ductDesignRequired: false,
          },
          balanceReport: {
            applicability: "DIRECT_DISCHARGE",
            summary: { total: 0, balancedCount: 0, adjustmentCount: 0 },
            rows: [],
          },
          branchBalancing: { applicability: "DIRECT_DISCHARGE", criticalBranchId: null, criticalPressureLossPa: null },
          airflowReconciliation: { applicability: "DIRECT_DISCHARGE", supplyAirflowCfm: designAirflowCfm, returnAirflowCfm: null },
          selection: {
            selectedCapacityKw,
            selectedAirflowCfm,
            selectedFanEspPa: null,
            capacityPass,
            airflowPass,
            passed: systemPass,
          },
          systemSummary: {
            systemId: "SYSTEM-01",
            systemType,
            distributionType,
            status: systemPass ? "PASS" : "ACTION_REQUIRED",
            applicability: "DIRECT_DISCHARGE",
          },
          engineeringStatus: systemPass ? "DIRECT_DISCHARGE_ACCEPTABLE" : "EQUIPMENT_SELECTION_REVIEW_REQUIRED",
          verificationRequired: true,
        };
        save(payload);
        setResult(payload);
        return;
      }

      const savedDistribution = saved?.result?.airDistribution?.roomId === activeRoomId ? saved.result.airDistribution : null;
      if (!savedDistribution?.criticalDuctLossPa && savedDistribution?.criticalDuctLossPa !== 0) {
        throw new Error("Run Stage 15 Air Distribution for this room first.");
      }
      if (!dx?.selection?.selected) throw new Error("Run Stage 14 equipment selection for this room first.");

      const measuredCfm = n(measured[activeRoomId], designAirflowCfm);
      const integrated = integrateAirBalancingAndSystem({
        terminals: [{ id: "T1", roomId: activeRoomId, designAirflowCfm, measuredAirflowCfm: measuredCfm }],
        branchPressureLossesPa: [{ id: "B1", pressureLossPa: n(savedDistribution.criticalDuctLossPa, n(pressure.critical)) }],
        tolerancePercent: n(tolerance, 10),
        roomLoadsKw: [n(roomResult.designLoadW) / 1000],
        roomAirflowsCfm: [designAirflowCfm],
        outdoorAirflowCfm: n(airside.outdoorAirflowM3s) * 2118.88,
        transferAirflowCfm: 0,
        criticalPathPressureLossPa: n(savedDistribution.criticalDuctLossPa, n(pressure.critical)),
        terminalPressureDropPa: n(pressure.terminal),
        coilPressureDropPa: n(pressure.coil),
        filterPressureDropPa: n(pressure.filter),
        damperPressureDropPa: n(pressure.damper),
        otherPressureDropsPa: [n(pressure.other)],
        espSafetyFactor: n(espSafety) / 100,
        capacityMargin: n(capacityMargin) / 100,
        selectedCapacityKw: n(selectedCapacity, n(dx.selection.selected.indoorUnit.coolingCapacityKw, 0)),
        selectedAirflowCfm: n(selectedAirflow, n(dx.selection.selected.indoorUnit.airflowCfm, designAirflowCfm)),
        selectedFanEspPa: n(selectedEsp, n(dx.selection.selected.indoorUnit.availableEspPa, 0)),
        maxOversizeFraction: n(maxOversize) / 100,
      });

      const payload = {
        roomId: activeRoomId,
        systemType,
        distributionType,
        inputs: { tolerancePercent: n(tolerance), capacityMarginPercent: n(capacityMargin), espSafetyFactorPercent: n(espSafety), maxOversizePercent: n(maxOversize), measuredAirflowCfm: measuredCfm, ...pressure, selectedCapacityKw: n(selectedCapacity), selectedAirflowCfm: n(selectedAirflow), selectedFanEspPa: n(selectedEsp) },
        ...integrated,
      };
      save(payload);
      setResult(payload);
    } catch (e) {
      setError(e.message || "Please check the Stage 16 inputs.");
    }
  };

  return <div className="container">
    <div className="page-header">
      <div><p className="eyebrow">ENGINEERING WORKFLOW · STAGE 16</p><h1 className="title">Air Balancing &amp; System Integration</h1><p className="subtitle">Balance ducted air systems and verify direct-discharge systems through their applicable equipment path.</p></div>
      <span className="version-badge">Stage 16</span>
    </div>

    <div className="card">
      <div className="section-heading"><h3>System Context</h3><span>01</span></div>
      <div className="stat-grid">
        <Stat label="HVAC system" value={systemType.replaceAll("_", " ")} />
        <Stat label="Air distribution" value={distributionType.replaceAll("_", " ")} />
        <Stat label="Air balancing" value={isDirectDischarge ? "NOT APPLICABLE" : "REQUIRED"} />
        <Stat label="Fan ESP verification" value={isDirectDischarge ? "NOT APPLICABLE" : "REQUIRED"} />
      </div>
    </div>

    {isDirectDischarge ? <div className="grid calculator-grid">
      <div className="card">
        <div className="section-heading"><h3>Direct-Discharge Integration</h3><span>02</span></div>
        <p className="form-note">This arrangement has no supply-duct network or fan ESP design basis. Stage 16 therefore does not invent balancing measurements or duct pressure losses. It verifies the selected equipment against the room design requirement.</p>
        <div className="stat-grid">
          <Stat label="Room" value={`${activeRoomId} · ${roomResult?.roomName || roomResult?.name || "Room"}`} />
          <Stat label="Design cooling load" value={`${(n(roomResult?.designLoadW) / 1000).toFixed(2)} kW`} />
          <Stat label="Design airflow" value={`${designAirflowCfm.toFixed(1)} CFM`} />
          <Stat label="Selected capacity" value={dx?.selection?.selected?.indoorUnit ? `${n(dx.selection.selected.indoorUnit.coolingCapacityKw).toFixed(2)} kW` : "Not selected"} />
          <Stat label="Selected airflow" value={dx?.selection?.selected?.indoorUnit?.airflowCfm ? `${n(dx.selection.selected.indoorUnit.airflowCfm).toFixed(1)} CFM` : "Not supplied"} />
          <Stat label="System status" value={result ? result.engineeringStatus.replaceAll("_", " ") : "READY TO RUN"} />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button onClick={run} disabled={!saved}>Run Stage 16</button>
      </div>
      <div className="card">
        <div className="section-heading"><h3>Engineering Boundary</h3><span>03</span></div>
        <p className="form-note">For direct-discharge units, field verification moves to Stage 17 and covers equipment operation, room performance, condensate, refrigerant installation, electrical supply, controls and documentation.</p>
        <p className="engineering-note"><b>Skipped:</b> terminal TAB, branch balancing, duct pressure loss and fan ESP.</p>
      </div>
    </div> : <DuctedWorkflow
      rooms={rooms}
      activeRoomId={activeRoomId}
      setRoomId={setRoomId}
      tolerance={tolerance}
      setTolerance={setTolerance}
      measured={measured}
      setMeasured={setMeasured}
      capacityMargin={capacityMargin}
      setCapacityMargin={setCapacityMargin}
      espSafety={espSafety}
      setEspSafety={setEspSafety}
      maxOversize={maxOversize}
      setMaxOversize={setMaxOversize}
      selectedCapacity={selectedCapacity}
      setSelectedCapacity={setSelectedCapacity}
      selectedAirflow={selectedAirflow}
      setSelectedAirflow={setSelectedAirflow}
      selectedEsp={selectedEsp}
      setSelectedEsp={setSelectedEsp}
      pressure={pressure}
      setPressure={setPressure}
      designAirflowCfm={designAirflowCfm}
      defaultMeasured={defaultMeasured}
      error={error}
      result={result}
      onRun={run}
      saved={saved}
    />}
  </div>;
}

function DuctedWorkflow({ rooms, activeRoomId, setRoomId, tolerance, setTolerance, measured, setMeasured, capacityMargin, setCapacityMargin, espSafety, setEspSafety, maxOversize, setMaxOversize, selectedCapacity, setSelectedCapacity, selectedAirflow, setSelectedAirflow, selectedEsp, setSelectedEsp, pressure, setPressure, designAirflowCfm, defaultMeasured, error, result, onRun, saved }) {
  return <div className="grid calculator-grid">
    <div className="card">
      <div className="section-heading"><h3>Workflow Inputs</h3><span>02</span></div>
      <div className="input-grid">
        <div><label>Room</label><select value={activeRoomId} onChange={(e) => setRoomId(e.target.value)}>{rooms.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name || "Unnamed room"}</option>)}</select></div>
        <Input label="Balance tolerance" value={tolerance} onChange={setTolerance} placeholder="%" />
        <Input label="Measured terminal airflow" value={measured[activeRoomId] ?? defaultMeasured.toFixed(0)} onChange={(v) => setMeasured({ ...measured, [activeRoomId]: v })} placeholder="CFM" />
        <Input label="Capacity margin" value={capacityMargin} onChange={setCapacityMargin} placeholder="%" />
        <Input label="ESP safety factor" value={espSafety} onChange={setEspSafety} placeholder="%" />
        <Input label="Maximum oversize" value={maxOversize} onChange={setMaxOversize} placeholder="%" />
      </div>
      <button onClick={onRun} disabled={!saved}>Run Stage 16</button>
    </div>
    <div className="results-stack">
      <div className="card"><div className="section-heading"><h3>Selected Equipment</h3><span>03</span></div><div className="input-grid"><Input label="Selected capacity" value={selectedCapacity} onChange={setSelectedCapacity} placeholder="kW" /><Input label="Selected airflow" value={selectedAirflow} onChange={setSelectedAirflow} placeholder="CFM" /><Input label="Selected fan ESP" value={selectedEsp} onChange={setSelectedEsp} placeholder="Pa" /></div></div>
      <div className="card"><div className="section-heading"><h3>Pressure-Drop Basis</h3><span>04</span></div><div className="input-grid"><Input label="Critical duct loss" value={pressure.critical} onChange={(v) => setPressure({ ...pressure, critical: v })} placeholder="Pa" /><Input label="Terminal" value={pressure.terminal} onChange={(v) => setPressure({ ...pressure, terminal: v })} placeholder="Pa" /><Input label="Coil" value={pressure.coil} onChange={(v) => setPressure({ ...pressure, coil: v })} placeholder="Pa" /><Input label="Filter" value={pressure.filter} onChange={(v) => setPressure({ ...pressure, filter: v })} placeholder="Pa" /><Input label="Damper" value={pressure.damper} onChange={(v) => setPressure({ ...pressure, damper: v })} placeholder="Pa" /><Input label="Other" value={pressure.other} onChange={(v) => setPressure({ ...pressure, other: v })} placeholder="Pa" /></div></div>
    </div>
    {error && <p className="error-message">{error}</p>}
    {result && <div className="card"><div className="section-heading"><h3>Integrated Result</h3><span>05</span></div><div className="stat-grid"><Stat label="Engineering status" value={result.engineeringStatus.replaceAll("_", " ")} /><Stat label="Terminal balance" value={`${result.balanceReport.summary.balancedCount}/${result.balanceReport.summary.total} balanced`} /><Stat label="Airflow deviation" value={`${result.balanceReport.rows[0].deviationPercent.toFixed(1)}%`} /><Stat label="Critical branch" value={result.branchBalancing.criticalBranchId} /><Stat label="Required capacity" value={`${result.requirements.designCapacityKw.toFixed(2)} kW`} /><Stat label="Required fan ESP" value={`${result.requirements.requiredFanESP_Pa.toFixed(1)} Pa`} /><Stat label="Selected capacity" value={`${result.selection.selectedCapacityKw.toFixed(2)} kW`} /><Stat label="System selection" value={result.selection.passed ? "PASS" : "FAIL"} /></div><p className="engineering-note"><b>Engineering boundary:</b> balancing status uses measured airflow supplied by the user. Final TAB measurements, terminal performance, equipment data and system selection must be verified before construction use.</p></div>}
  </div>;
}

function Input({ label, value, onChange, placeholder }) { return <div><label>{label}</label><input type="number" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>; }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><b>{value}</b></div>; }
