import { calculateProjectCoolingLoads, calculateRoomCoolingLoad } from "../engineering/cooling-load/roomLoadEngine.js";

const approx = (actual, expected, tolerance = 1e-9) => {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`Expected ${actual} to equal ${expected}`);
};

const room = {
  id: "OFFICE-1",
  name: "Office 1",
  length: 6,
  width: 5,
  height: 3,
  people: 4,
  windowAreaM2: 4,
};

const engineering = {
  walls: { area: 66, uValue: 0.5, cltd: 10 },
  roof: { area: 30, uValue: 0.3, cltd: 8 },
  windows: { area: 4, uValue: 2.5, cltd: 8, shgc: 0.4, solarIrradiance: 500 },
  people: { sensibleHeatPerPerson: 75, latentHeatPerPerson: 55 },
  lighting: { powerDensity: 10 },
  equipment: [{ type: "computer", quantity: 4, watts: 120 }],
  ventilation: {
    outdoorAirPerPersonLps: 8,
    outdoorAirPerAreaLpsM2: 0.3,
    indoorDryBulbC: 24,
    indoorRelativeHumidityPercent: 50,
    outdoorDryBulbC: 34.8,
    outdoorRelativeHumidityPercent: 70,
  },
  infiltration: {
    infiltrationAirLps: 20,
    indoorDryBulbC: 24,
    indoorRelativeHumidityPercent: 50,
    outdoorDryBulbC: 34.8,
    outdoorRelativeHumidityPercent: 70,
  },
};

export const runRoomLoadEngineTests = () => [
  { id: "LOADENG-001", name: "Calculate complete room load", passed: calculateRoomCoolingLoad({ room, engineering }).rawLoad.totalW > 0 },
  { id: "LOADENG-002", name: "Preserve room identity", passed: (() => { const r = calculateRoomCoolingLoad({ room, engineering }); return r.roomId === "OFFICE-1" && r.roomName === "Office 1"; })() },
  { id: "LOADENG-003", name: "Calculate room geometry", passed: (() => { const r = calculateRoomCoolingLoad({ room, engineering }); return r.geometry.floorAreaM2 === 30 && r.geometry.volumeM3 === 90; })() },
  { id: "LOADENG-004", name: "Wall component is traceable", passed: (() => calculateRoomCoolingLoad({ room, engineering }).components.walls.total === 330)() },
  { id: "LOADENG-005", name: "Window conduction and solar are combined", passed: (() => { const r = calculateRoomCoolingLoad({ room, engineering }); approx(r.components.windows.total, 880); return true; })() },
  { id: "LOADENG-006", name: "People sensible and latent loads are included", passed: (() => { const r = calculateRoomCoolingLoad({ room, engineering }); return r.components.people.sensible === 300 && r.components.people.latent === 220; })() },
  { id: "LOADENG-007", name: "Design margin is separate from raw load", passed: (() => { const r = calculateRoomCoolingLoad({ room, engineering, designMarginPercent: 10 }); return r.designLoad.totalW > r.rawLoad.totalW && r.designMarginPercent === 10; })() },
  { id: "LOADENG-008", name: "Missing optional components default to zero", passed: (() => { const r = calculateRoomCoolingLoad({ room, engineering: {} }); return r.rawLoad.totalW === 0 && r.rawLoad.sensibleHeatRatio === 0; })() },
  { id: "LOADENG-009", name: "Calculate multiple project room loads", passed: (() => { const r = calculateProjectCoolingLoads({ rooms: [room, { ...room, id: "OFFICE-2", name: "Office 2", people: 2 }], engineeringByRoom: { "OFFICE-1": engineering, "OFFICE-2": engineering } }); return r.roomCount === 2 && r.totalRawLoadW > r.roomResults[0].rawLoad.totalW; })() },
  { id: "LOADENG-010", name: "Project loads are reported in kW", passed: (() => { const r = calculateProjectCoolingLoads({ rooms: [room], engineeringByRoom: { "OFFICE-1": engineering } }); approx(r.totalRawLoadKw, r.totalRawLoadW / 1000); return true; })() },
];
