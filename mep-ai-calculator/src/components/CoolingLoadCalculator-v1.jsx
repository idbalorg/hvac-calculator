import { useState } from "react";

export default function CoolingLoadCalculator() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [people, setPeople] = useState("");
  const [equipmentLoad, setEquipmentLoad] = useState("");
  const [roomType, setRoomType] = useState("office");

  const [unitSystem, setUnitSystem] = useState("metric");

  const [result, setResult] = useState(null);

  const getLoadFactor = () => {
    switch (roomType) {
      case "residential":
        return 120;
      case "office":
        return 140;
      case "shop":
        return 150;
      default:
        return 140;
    }
  };

  const toMeters = (value) => {
    if (unitSystem === "imperial") return Number(value) * 0.3048;
    return Number(value);
  };

  const toWatts = (value) => {
    if (unitSystem === "imperial") return Number(value) * 3.412;
    return Number(value);
  };

  const calculateCLTD = () => {
    const L = toMeters(length) || 0;
    const W = toMeters(width) || 0;
    const H = toMeters(height) || 0;

    const peopleCount = Number(people) || 0;
    const equipLoad = toWatts(equipmentLoad) || 0;

    const floorArea = L * W;
    const wallArea = 2 * H * (L + W);
    const roofArea = floorArea;

    // U-values (W/m²K equivalent simplified)
    const U_wall = 1.5;
    const U_roof = 0.8;

    // CLTD assumptions
    const CLTD_wall = 10;
    const CLTD_roof = 15;

    const wallLoad = U_wall * wallArea * CLTD_wall;
    const roofLoad = U_roof * roofArea * CLTD_roof;

    const areaLoad = floorArea * getLoadFactor();
    const peopleLoad = peopleCount * 120;

    const totalLoadW = wallLoad + roofLoad + areaLoad + peopleLoad + equipLoad;

    const totalLoadKW = totalLoadW / 1000;

    const tons = totalLoadKW / 3.516;
    const hp = totalLoadKW / 0.75;

    // Imperial conversions
    const totalBTU = totalLoadW * 3.412;

    setResult({
      unitSystem,
      area: floorArea,
      wallLoad,
      roofLoad,
      areaLoad,
      peopleLoad,
      equipLoad,
      totalLoadW,
      totalLoadKW,
      totalBTU,
      tons,
      hp,
    });
  };

  return (
    <div style={{ maxWidth: "500px", margin: "auto", padding: "20px" }}>
      <h2>Cooling Load Calculator</h2>

      {/* Unit Switch */}
      <select
        value={unitSystem}
        onChange={(e) => setUnitSystem(e.target.value)}
      >
        <option value="metric">Metric (m, kW)</option>
        <option value="imperial">Imperial (ft, BTU)</option>
      </select>

      <input
        type="number"
        placeholder={unitSystem === "metric" ? "Length (m)" : "Length (ft)"}
        value={length}
        onChange={(e) => setLength(e.target.value)}
      />

      <input
        type="number"
        placeholder={unitSystem === "metric" ? "Width (m)" : "Width (ft)"}
        value={width}
        onChange={(e) => setWidth(e.target.value)}
      />

      <input
        type="number"
        placeholder={unitSystem === "metric" ? "Height (m)" : "Height (ft)"}
        value={height}
        onChange={(e) => setHeight(e.target.value)}
      />

      <input
        type="number"
        placeholder="Number of People"
        value={people}
        onChange={(e) => setPeople(e.target.value)}
      />

      <input
        type="number"
        placeholder={
          unitSystem === "metric"
            ? "Equipment Load (W)"
            : "Equipment Load (BTU/hr)"
        }
        value={equipmentLoad}
        onChange={(e) => setEquipmentLoad(e.target.value)}
      />

      <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
        <option value="residential">Residential</option>
        <option value="office">Office</option>
        <option value="shop">Shop</option>
      </select>

      <button onClick={calculateCLTD} style={{ marginTop: "10px" }}>
        Calculate
      </button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Results</h3>

          <p>Area: {result.area.toFixed(2)} m²</p>

          <p>Wall Load: {result.wallLoad.toFixed(0)} W</p>
          <p>Roof Load: {result.roofLoad.toFixed(0)} W</p>
          <p>People Load: {result.peopleLoad.toFixed(0)} W</p>
          <p>Equipment Load: {result.equipLoad.toFixed(0)} W</p>

          <hr />

          {unitSystem === "metric" ? (
            <>
              <p>
                <strong>Total Load:</strong> {result.totalLoadKW.toFixed(2)} kW
              </p>
              <p>
                <strong>Tonnage:</strong> {result.tons.toFixed(2)} TR
              </p>
              <p>
                <strong>HP Equivalent:</strong> {result.hp.toFixed(1)} HP
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Total Load:</strong> {result.totalBTU.toFixed(0)} BTU/hr
              </p>
              <p>
                <strong>Tonnage:</strong> {result.tons.toFixed(2)} TR
              </p>
            </>
          )}

          <p style={{ marginTop: "10px", fontSize: "12px", color: "gray" }}>
            Simplified CLTD model. Real HVAC design requires full load analysis.
          </p>
        </div>
      )}
    </div>
  );
}
