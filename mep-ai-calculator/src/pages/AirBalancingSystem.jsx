import { useEffect, useMemo, useState } from "react";
import { integrateAirBalancingAndSystem } from "../engineering/airside/airBalanceSystemIntegration.js";

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function AirBalancingSystem() {
  const [saved, setSaved] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [tolerancePercent, setTolerancePercent] = useState(10);
  const [measured, setMeasured] = useState({});
  const [selectedCapacityKw, setSelectedCapacityKw] = useState(9);
  const [selectedAirflowCfm, setSelectedAirflowCfm] = useState(800);
  const [selectedFanEspPa, setSelectedFanEspPa] = useState(440);
  const [capacityMarginPercent, setCapacityMarginPercent] = useState(10);
  const [espSafetyFactorPercent, setEspSafetyFactorPercent] = useState(10);
  const [maxOversizePercent, setMaxOversizePercent] = useState(20);
  const [pressure, setPressure] = useState({ critical: 180, terminal: 30, coil: 80, filter: 40, damper: 20, other: 10 });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]");
    const current = projects.find((project) => project.current) || projects[0] || null;
    setSaved(current);
    setRoomId(current?.rooms?.[0]?.id || "");
  }, []);

  const rooms = saved?.rooms || [];
  const room = rooms.find((item) => item.id === roomId) || rooms[0];
  const airside = saved?.result?.airside?.roomResults?.find?.((item) => item.roomId === room?.id);
  const distribution = saved?.result?.airDistribution;
  const dx = saved?.result?.dxSystem;

  const defaultAirflow = number(airside?.supplyAirflowM3s) * 2118.88;
  const terminal = useMemo(() => ({
    id: `T-${room?.id || "01"}`,
    roomId: room?.id || null,
    designAirflowCfm: defaultAirflow || 400,
    measuredAirflowCfm: number(measured[room?.id || "default"], defaultAirflow || 400),
  }), [room, defaultAirflow, measured]);

  const run = () => {
    if (!room || !airside) {
      setStatus({ error: "Run the room cooling load and Psychrometrics & Airside stages first." });
      return;
    }

    const designAirflowCfm = defaultAirflow || 400;
    const result = integrateAirBalancingAndSystem({
      terminals: [terminal],
      branchPressureLossesPa: [{ id: "B1", pressureLossPa: number(distribution?.criticalDuctLossPa, number(pressure.critical)) }],
      tolerancePercent: number(tolerancePercent, 10),
      roomLoadsKw: [number(room.designLoadW, 0) / 1000],
      roomAirflowsCfm: [designAirflowCfm],
      outdoorAirflowCfm: number(airside?.outdoorAirflowM3s) * 2118.88,
      transferAirflowCfm: 0,
      criticalPathPressureLossPa: number(distribution?.criticalDuctLossPa, number(pressure.critical)),
      terminalPressureDropPa: number(pressure.terminal),
      coilPressureDropPa: number(pressure.coil),
      filterPressureDropPa: number(pressure.filter),
      damperPressureDropPa: number(pressure.damper),
      otherPressureDropsPa: [number(pressure.other)],
      espSafetyFactor: number(espSafetyFactorPercent) / 100,
      capacityMargin: number(capacityMarginPercent) / 100,
      selectedCapacityKw: number(selectedCapacityKw),
      selectedAirflowCfm: number(selectedAirflowCfm),
      selectedFanEspPa: number(selectedFanEspPa),
      maxOversizeFraction: number(maxOversizePercent) / 100,
    });

    const projects = JSON.parse(localStorage.getItem("hvac-projects") || "[]");
    const index = projects.findIndex((project) => project.id === saved?.id);
    if (index >= 0) {
      projects[index].current = { ...(projects[index].current || {}), result: { ...(projects[index].current?.result || {}), airBalanceSystem: result } };
      localStorage.setItem("hvac-projects", JSON.stringify(projects));
      setSaved(projects[index]);
    }
    setStatus(result);
  };

  if (!saved) return <main className="page"><h1>Air Balancing & System Integration</h1><p>Create a project and run the earlier design stages first.</p></main>;

  return <main className="page">
    <h1>Air Balancing & System Integration</h1>
    <p>Stage 16 reconciles terminal measurements, branch balancing targets and system-level capacity, airflow and fan ESP.</p>
    <p><strong>Engineering boundary:</strong> measured airflow represents field TAB data. Damper pressure-drop targets are design targets only and must be adjusted using field measurements and manufacturer characteristics.</p>

    <section className="card">
      <h2>Design Basis</h2>
      <label>Room<select value={room?.id || ""} onChange={(event) => setRoomId(event.target.value)}>{rooms.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select></label>
      <label>Balance tolerance (%)<input type="number" value={tolerancePercent} onChange={(event) => setTolerancePercent(event.target.value)} /></label>
      <div className="grid">
        <div><strong>Stage 13 airflow</strong><p>{defaultAirflow.toFixed(0)} CFM</p></div>
        <div><strong>Stage 15 duct loss</strong><p>{number(distribution?.criticalDuctLossPa, number(pressure.critical)).toFixed(1)} Pa</p></div>
        <div><strong>Stage 14 DX capacity</strong><p>{number(dx?.requiredCapacityW) / 1000 || "Not saved"} kW</p></div>
      </div>
    </section>

    <section className="card">
      <h2>Field Air Balance</h2>
      <label>Measured airflow for {room?.id}<input type="number" value={measured[room?.id] ?? defaultAirflow.toFixed(0)} onChange={(event) => setMeasured({ ...measured, [room.id]: event.target.value })} /></label>
      <p>Design airflow: {defaultAirflow.toFixed(0)} CFM</p>
    </section>

    <section className="card">
      <h2>System Selection Check</h2>
      <div className="grid">
        <label>Selected capacity (kW)<input type="number" value={selectedCapacityKw} onChange={(event) => setSelectedCapacityKw(event.target.value)} /></label>
        <label>Selected airflow (CFM)<input type="number" value={selectedAirflowCfm} onChange={(event) => setSelectedAirflowCfm(event.target.value)} /></label>
        <label>Selected fan ESP (Pa)<input type="number" value={selectedFanEspPa} onChange={(event) => setSelectedFanEspPa(event.target.value)} /></label>
        <label>Capacity margin (%)<input type="number" value={capacityMarginPercent} onChange={(event) => setCapacityMarginPercent(event.target.value)} /></label>
        <label>ESP safety factor (%)<input type="number" value={espSafetyFactorPercent} onChange={(event) => setEspSafetyFactorPercent(event.target.value)} /></label>
        <label>Maximum oversize (%)<input type="number" value={maxOversizePercent} onChange={(event) => setMaxOversizePercent(event.target.value)} /></label>
      </div>
    </section>

    <section className="card">
      <h2>Pressure-Drop Inputs</h2>
      <div className="grid">{Object.entries(pressure).map(([key, value]) => <label key={key}>{key} (Pa)<input type="number" value={value} onChange={(event) => setPressure({ ...pressure, [key]: event.target.value })} /></label>)}</div>
    </section>

    <button onClick={run}>Run Stage 16</button>

    {status?.error && <div className="card"><strong>{status.error}</strong></div>}
    {status && !status.error && <section className="card">
      <h2>Stage 16 Result</h2>
      <div className="grid">
        <div><strong>Status</strong><p>{status.engineeringStatus}</p></div>
        <div><strong>Terminal balance</strong><p>{status.balanceReport.summary.balancedCount}/{status.balanceReport.summary.total} balanced</p></div>
        <div><strong>Critical branch</strong><p>{status.branchBalancing.criticalBranchId}</p></div>
        <div><strong>Required capacity</strong><p>{status.requirements.designCapacityKw.toFixed(2)} kW</p></div>
        <div><strong>Required fan ESP</strong><p>{status.requirements.requiredFanEspPa.toFixed(1)} Pa</p></div>
        <div><strong>Selection</strong><p>{status.selection.passed ? "PASS" : "FAIL"}</p></div>
      </div>
      {status.balanceReport.rows.map((row) => <p key={row.id}>{row.id}: {row.deviationPercent.toFixed(1)}% deviation, <strong>{row.status}</strong></p>)}
      <p><strong>Verification required:</strong> Yes. Final TAB results, equipment performance and system selection must be verified before construction use.</p>
    </section>}
  </main>;
}
