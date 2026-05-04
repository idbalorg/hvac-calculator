import { useState } from "react";
import jsPDF from "jspdf";

export default function CoolingLoadCalculator() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const [people, setPeople] = useState("");
  const [equipmentLoad, setEquipmentLoad] = useState("");
  const [windowArea, setWindowArea] = useState("");

  const [orientation, setOrientation] = useState("average");
  const [city, setCity] = useState("lagos");
  const [unitSystem, setUnitSystem] = useState("metric");

  const [result, setResult] = useState(null);

  // ----------------------------
  // CITY CLIMATE FACTORS
  // ----------------------------
  const cityFactor = {
    lagos: 1.15,
    abuja: 1.1,
    london: 0.85,
    newyork: 1.0,
  };

  // ----------------------------
  // ORIENTATION FACTOR
  // ----------------------------
  const orientationFactor = {
    north: 0.9,
    south: 1.2,
    east: 1.1,
    west: 1.2,
    average: 1.0,
  };

  const getLoadFactor = () => {
    return 140; // base W/m²
  };

  const toMeters = (v) =>
    unitSystem === "imperial" ? Number(v) * 0.3048 : Number(v);

  const toWatts = (v) =>
    unitSystem === "imperial" ? Number(v) * 3.412 : Number(v);

  const calculate = () => {
    const L = toMeters(length) || 0;
    const W = toMeters(width) || 0;
    const H = toMeters(height) || 0;

    const floorArea = L * W;
    const wallArea = 2 * H * (L + W);
    const roofArea = floorArea;

    const peopleLoad = (Number(people) || 0) * 120;
    const equipLoad = toWatts(equipmentLoad) || 0;

    const windowLoad =
      (Number(windowArea) || 0) * 200 * orientationFactor[orientation];

    const U_wall = 1.5;
    const U_roof = 0.8;

    const CLTD_wall = 10;
    const CLTD_roof = 15;

    const wallLoad = U_wall * wallArea * CLTD_wall;
    const roofLoad = U_roof * roofArea * CLTD_roof;

    const areaLoad = floorArea * getLoadFactor();

    let totalLoadW =
      wallLoad + roofLoad + areaLoad + peopleLoad + equipLoad + windowLoad;

    // apply city climate adjustment
    totalLoadW *= cityFactor[city];

    const totalKW = totalLoadW / 1000;
    const tons = totalKW / 3.516;
    const btu = totalLoadW * 3.412;

    // AC sizing suggestion
    const acSize =
      tons <= 1.5
        ? "1.5 HP Split AC"
        : tons <= 2.5
          ? "2.5 HP Split AC"
          : tons <= 3.5
            ? "3.5 HP Split AC"
            : "Multiple Units or VRF System";

    setResult({
      floorArea,
      wallLoad,
      roofLoad,
      areaLoad,
      peopleLoad,
      equipLoad,
      windowLoad,
      totalKW,
      tons,
      btu,
      acSize,
    });
  };

  // ----------------------------
  // PDF EXPORT
  // ----------------------------
  const exportPDF = () => {
    if (!result) return;

    const doc = new jsPDF();

    doc.text("Cooling Load Report", 20, 20);

    doc.text(`City: ${city}`, 20, 40);
    doc.text(`Total Load: ${result.totalKW.toFixed(2)} kW`, 20, 50);
    doc.text(`Tonnage: ${result.tons.toFixed(2)} TR`, 20, 60);
    doc.text(`Recommended AC: ${result.acSize}`, 20, 70);

    doc.save("hvac-report.pdf");
  };

  return (
    <div style={{ maxWidth: 520, margin: "auto", padding: 20 }}>
      <h2>HVAC Cooling Load Calculator</h2>

      {/* Unit System */}
      <select
        value={unitSystem}
        onChange={(e) => setUnitSystem(e.target.value)}
      >
        <option value="metric">Metric</option>
        <option value="imperial">Imperial</option>
      </select>

      {/* City */}
      <select value={city} onChange={(e) => setCity(e.target.value)}>
        <option value="lagos">Lagos</option>
        <option value="abuja">Abuja</option>
        <option value="london">London</option>
        <option value="newyork">New York</option>
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
        placeholder="Window Area (m² or ft²)"
        value={windowArea}
        onChange={(e) => setWindowArea(e.target.value)}
      />

      {/* Orientation */}
      <select
        value={orientation}
        onChange={(e) => setOrientation(e.target.value)}
      >
        <option value="average">Average</option>
        <option value="north">North</option>
        <option value="south">South</option>
        <option value="east">East</option>
        <option value="west">West</option>
      </select>

      <button onClick={calculate} style={{ marginTop: 10 }}>
        Calculate
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Results</h3>

          <p>Total Load: {result.totalKW.toFixed(2)} kW</p>
          <p>Tonnage: {result.tons.toFixed(2)} TR</p>
          <p>BTU/hr: {result.btu.toFixed(0)}</p>

          <p>Recommended: {result.acSize}</p>

          <hr />

          <p>Wall Load: {result.wallLoad.toFixed(0)} W</p>
          <p>Roof Load: {result.roofLoad.toFixed(0)} W</p>
          <p>Window Load: {result.windowLoad.toFixed(0)} W</p>
          <p>People Load: {result.peopleLoad.toFixed(0)} W</p>

          <button onClick={exportPDF} style={{ marginTop: 10 }}>
            Export PDF Report
          </button>
        </div>
      )}
    </div>
  );
}
