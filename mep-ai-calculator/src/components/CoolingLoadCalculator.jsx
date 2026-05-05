import { useState } from "react";
import "./App.css";

export default function CoolingLoadCalculator() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [people, setPeople] = useState("");
  const [equipmentLoad, setEquipmentLoad] = useState("");
  const [windowArea, setWindowArea] = useState("");

  const [result, setResult] = useState(null);

  const calculate = () => {
    const L = Number(length) || 0;
    const W = Number(width) || 0;
    const H = Number(height) || 0;

    const floorArea = L * W;
    const wallArea = 2 * H * (L + W);

    const wallLoad = wallArea * 1.5 * 10;
    const roofLoad = floorArea * 0.8 * 15;

    const areaLoad = floorArea * 140;
    const peopleLoad = (Number(people) || 0) * 120;
    const equipLoad = Number(equipmentLoad) || 0;
    const windowLoad = (Number(windowArea) || 0) * 180;

    const totalW =
      wallLoad + roofLoad + areaLoad + peopleLoad + equipLoad + windowLoad;

    const kW = totalW / 1000;
    const tons = kW / 3.516;

    setResult({ floorArea, wallLoad, roofLoad, kW, tons });
  };

  return (
    <div className="container">
      <h1 className="title">HVAC Load Design Tool</h1>

      <div className="grid">
        {/* INPUT */}
        <div className="card">
          <h3>Design Inputs</h3>

          <input placeholder="Length" value={length} onChange={(e) => setLength(e.target.value)} />
          <input placeholder="Width" value={width} onChange={(e) => setWidth(e.target.value)} />
          <input placeholder="Height" value={height} onChange={(e) => setHeight(e.target.value)} />

          <input placeholder="People" value={people} onChange={(e) => setPeople(e.target.value)} />
          <input placeholder="Equipment Load" value={equipmentLoad} onChange={(e) => setEquipmentLoad(e.target.value)} />
          <input placeholder="Window Area" value={windowArea} onChange={(e) => setWindowArea(e.target.value)} />

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

            <div className="stat">
              <span>Total Load</span>
              <b>{result.kW.toFixed(2)} kW</b>
            </div>

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
          </div>
        )}
      </div>
    </div>
  );
}