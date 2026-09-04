import { calculateRoomGeometry, validateProjectInput } from "../engineering/project/projectValidation.js";

const approx = (actual, expected, tolerance = 1e-9) => {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`Expected ${actual} to equal ${expected}`);
};

const expectError = (fn, message) => {
  let thrown = false;
  try { fn(); } catch (error) { thrown = error.message.includes(message); }
  if (!thrown) throw new Error(`Expected error containing: ${message}`);
};

export const runProjectValidationTests = () => [
  { id: "PROJ-001", name: "Valid project input", passed: validateProjectInput({ length: 6, width: 5, height: 3, people: 6, equipmentLoadKw: 1.2, windowAreaM2: 6 }) === true },
  { id: "PROJ-002", name: "Reject zero length", passed: (() => { expectError(() => validateProjectInput({ length: 0, width: 5, height: 3 }), "length"); return true; })() },
  { id: "PROJ-003", name: "Reject negative width", passed: (() => { expectError(() => validateProjectInput({ length: 6, width: -1, height: 3 }), "width"); return true; })() },
  { id: "PROJ-004", name: "Reject zero height", passed: (() => { expectError(() => validateProjectInput({ length: 6, width: 5, height: 0 }), "height"); return true; })() },
  { id: "PROJ-005", name: "Reject fractional occupants", passed: (() => { expectError(() => validateProjectInput({ length: 6, width: 5, height: 3, people: 2.5 }), "people"); return true; })() },
  { id: "PROJ-006", name: "Reject negative equipment load", passed: (() => { expectError(() => validateProjectInput({ length: 6, width: 5, height: 3, equipmentLoadKw: -1 }), "equipmentLoadKw"); return true; })() },
  { id: "PROJ-007", name: "Calculate floor area", passed: (() => { const r = calculateRoomGeometry({ length: 6, width: 5, height: 3 }); approx(r.floorAreaM2, 30); return true; })() },
  { id: "PROJ-008", name: "Calculate room volume", passed: (() => { const r = calculateRoomGeometry({ length: 6, width: 5, height: 3 }); approx(r.volumeM3, 90); return true; })() },
  { id: "PROJ-009", name: "Calculate wall area", passed: (() => { const r = calculateRoomGeometry({ length: 6, width: 5, height: 3 }); approx(r.wallAreaM2, 66); return true; })() },
  { id: "PROJ-010", name: "Geometry rejects invalid dimensions", passed: (() => { expectError(() => calculateRoomGeometry({ length: 6, width: 5, height: -1 }), "height"); return true; })() },
];
