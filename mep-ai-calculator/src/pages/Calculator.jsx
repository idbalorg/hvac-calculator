import { useState } from "react";
import "../App.css";

export default function CoolingLoadCalculator() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [people, setPeople] = useState("");
  const [equipmentLoad, setEquipmentLoad] = useState("");
  const [windowArea, setWindowArea] = useState("");

  const [unitSystem, setUnitSystem] = useState("metric");

  const [result, setResult] = useState(null);

  // 🔁 Conversion helpers
  const toMeters = (val) =>
    unitSystem === "imperial" ? Number(val) * 0.3048 : Number(val);

  const toWatts = (val) =>
    unitSystem === "imperial" ? Number(val) * 0.293 : Number(val); // BTU/hr → W

  const calculate = () => {
    const L = toMeters(length) || 0;
    const W = toMeters(width) || 0;
    const H = toMeters(height) || 0;

    const floorArea = L * W;
    const wallArea = 2 * H * (L + W);

    const wallLoad = wallArea * 1.5 * 10;
    const roofLoad = floorArea * 0.8 * 15;

    const areaLoad = floorArea * 140;
    const peopleLoad = (Number(people) || 0) * 120;

    const equipLoad = toWatts(equipmentLoad) || 0;

    const windowLoad =
      (unitSystem === "imperial"
        ? Number(windowArea) * 0.092 // ft² → m²
        : Number(windowArea)) * 180;

    const totalW =
      wallLoad + roofLoad + areaLoad + peopleLoad + equipLoad + windowLoad;

    const kW = totalW / 1000;
    const tons = kW / 3.516;
    const btu = totalW * 3.412;

    setResult({
      floorArea,
      totalW,
      kW,
      tons,
      btu,
    });
  };

  const saveProject = () => {
    const project = {
      unitSystem,
      length,
      width,
      height,
      people,
      equipmentLoad,
      windowArea,
      result,
      date: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("hvac-projects")) || [];
    existing.push(project);

    localStorage.setItem("hvac-projects", JSON.stringify(existing));
  };

  return (
    <div className="container">
      <h1 className="title">HVAC Load Design Tool</h1>

      <div className="grid">
        {/* INPUT */}
        <div className="card">
          <h3>Design Inputs</h3>

          {/* Unit Selector */}
          <select
            value={unitSystem}
            onChange={(e) => setUnitSystem(e.target.value)}
          >
            <option value="metric">Metric (m, kW)</option>
            <option value="imperial">Imperial (ft, BTU)</option>
          </select>

          <input
            placeholder={`Length (${unitSystem === "metric" ? "m" : "ft"})`}
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />

          <input
            placeholder={`Width (${unitSystem === "metric" ? "m" : "ft"})`}
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />

          <input
            placeholder={`Height (${unitSystem === "metric" ? "m" : "ft"})`}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />

          <input
            placeholder="People"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />

          <input
            placeholder={
              unitSystem === "metric"
                ? "Equipment Load (W)"
                : "Equipment Load (BTU/hr)"
            }
            value={equipmentLoad}
            onChange={(e) => setEquipmentLoad(e.target.value)}
          />

          <input
            placeholder={
              unitSystem === "metric" ? "Window Area (m²)" : "Window Area (ft²)"
            }
            value={windowArea}
            onChange={(e) => setWindowArea(e.target.value)}
          />

          <button onClick={calculate}>Run Calculation</button>
        </div>

        {/* OUTPUT */}
        {result && (
          <div className="card">
            <h3>Load Summary</h3>

            <div className="stat">
              <span>Floor Area</span>
              <b>{result.floorArea.toFixed(2)} m²</b>
            </div>

            {unitSystem === "metric" ? (
              <>
                <div className="stat">
                  <span>Total Load</span>
                  <b>{result.kW.toFixed(2)} kW</b>
                </div>
              </>
            ) : (
              <>
                <div className="stat">
                  <span>Total Load</span>
                  <b>{result.btu.toFixed(0)} BTU/hr</b>
                </div>
              </>
            )}

            <div className="stat">
              <span>Cooling Capacity</span>
              <b>{result.tons.toFixed(2)} TR</b>
            </div>

            <div className="highlight">
              Recommended System:{" "}
              <b>
                {result.tons <= 2
                  ? "Split AC System"
                  : result.tons <= 5
                    ? "VRF / Multi Split"
                    : "Central Chiller System"}
              </b>
            </div>

            <button onClick={saveProject}>Save Project</button>
          </div>
        )}
      </div>
    </div>
  );
}
