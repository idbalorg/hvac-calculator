import { buildProjectRooms, calculateProjectRoomSummary, createRoom, validateRoom, validateUniqueRoomIds } from "../engineering/project/projectRooms.js";

const approx = (actual, expected, tolerance = 1e-9) => {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`Expected ${actual} to equal ${expected}`);
};

const expectError = (fn, message) => {
  let thrown = false;
  try { fn(); } catch (error) { thrown = error.message.includes(message); }
  if (!thrown) throw new Error(`Expected error containing: ${message}`);
};

const rooms = [
  createRoom({ id: "Reception", name: "Reception", length: 6, width: 5, height: 3, people: 4, equipmentLoadKw: 0.8, windowAreaM2: 5 }),
  createRoom({ id: "Open Office", name: "Open Office", length: 10, width: 8, height: 3, people: 12, equipmentLoadKw: 2.4, windowAreaM2: 12 }),
];

export const runProjectRoomTests = () => [
  { id: "ROOM-001", name: "Valid room", passed: validateRoom(rooms[0]) === true },
  { id: "ROOM-002", name: "Normalize room ID", passed: createRoom({ id: "Meeting Room 1", name: "Meeting Room 1", length: 5, width: 4, height: 3 }).id === "MEETING-ROOM-1" },
  { id: "ROOM-003", name: "Reject missing room name", passed: (() => { expectError(() => createRoom({ id: "R1", name: "", length: 5, width: 4, height: 3 }), "room.name"); return true; })() },
  { id: "ROOM-004", name: "Reject invalid dimensions", passed: (() => { expectError(() => createRoom({ id: "R1", name: "Room", length: 0, width: 4, height: 3 }), "room.length"); return true; })() },
  { id: "ROOM-005", name: "Reject fractional occupants", passed: (() => { expectError(() => createRoom({ id: "R1", name: "Room", length: 5, width: 4, height: 3, people: 1.5 }), "room.people"); return true; })() },
  { id: "ROOM-006", name: "Detect duplicate room IDs", passed: (() => { expectError(() => validateUniqueRoomIds([rooms[0], { ...rooms[1], id: "RECEPTION" }]), "Duplicate room id"); return true; })() },
  { id: "ROOM-007", name: "Calculate project room count", passed: calculateProjectRoomSummary(rooms).roomCount === 2 },
  { id: "ROOM-008", name: "Calculate total floor area", passed: (() => { const r = calculateProjectRoomSummary(rooms); approx(r.floorAreaM2, 110); return true; })() },
  { id: "ROOM-009", name: "Calculate total volume", passed: (() => { const r = calculateProjectRoomSummary(rooms); approx(r.volumeM3, 330); return true; })() },
  { id: "ROOM-010", name: "Calculate total occupants and loads", passed: (() => { const r = calculateProjectRoomSummary(rooms); return r.occupants === 16 && r.equipmentLoadKw === 3.2 && r.windowAreaM2 === 17; })() },
  { id: "ROOM-011", name: "Build room geometry", passed: (() => { const r = buildProjectRooms(rooms); return r[0].geometry.floorAreaM2 === 30 && r[1].geometry.floorAreaM2 === 80 && r[1].geometry.wallAreaM2 === 108; })() },
  { id: "ROOM-012", name: "Reject empty room collection", passed: (() => { expectError(() => validateUniqueRoomIds([]), "at least one room"); return true; })() },
];
