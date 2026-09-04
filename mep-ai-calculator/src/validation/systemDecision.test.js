import { evaluateSystemOption, recommendHVACSystems, validateSystemDecisionInput } from "../engineering/system/systemDecision.js";

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
};

const assertTrue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const assertThrows = (fn, message) => {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) throw new Error(message);
};

const baseInput = {
  totalCoolingLoadKw: 40,
  floorAreaM2: 400,
  zoneCount: 8,
  ventilationRequired: false,
  zoningPriority: "high",
  ceilingSpaceLimited: false,
  outdoorUnitSpaceLimited: false,
  centralPlantAvailable: false,
};

export const runSystemDecisionTests = () => [
  {
    id: "DEC-001",
    name: "Valid decision input",
    passed: validateSystemDecisionInput(baseInput) === true,
  },
  {
    id: "DEC-002",
    name: "Multi-zone project favors VRF",
    passed: evaluateSystemOption({ ...baseInput, systemType: "VRF" }).score > evaluateSystemOption({ ...baseInput, systemType: "SPLIT_DX" }).score,
  },
  {
    id: "DEC-003",
    name: "High load favors chilled water",
    passed: evaluateSystemOption({ ...baseInput, totalCoolingLoadKw: 180, zoneCount: 20, systemType: "CHILLED_WATER" }).score > evaluateSystemOption({ ...baseInput, totalCoolingLoadKw: 180, zoneCount: 20, systemType: "SPLIT_DX" }).score,
  },
  {
    id: "DEC-004",
    name: "Small load does not favor chilled water",
    passed: evaluateSystemOption({ ...baseInput, totalCoolingLoadKw: 8, zoneCount: 2, systemType: "CHILLED_WATER" }).warnings.length > 0,
  },
  {
    id: "DEC-005",
    name: "Ceiling constraint penalizes ducted split",
    passed: evaluateSystemOption({ ...baseInput, ceilingSpaceLimited: true, systemType: "DUCTED_SPLIT" }).warnings.length > 0,
  },
  {
    id: "DEC-006",
    name: "Ventilation warning for VRF",
    passed: evaluateSystemOption({ ...baseInput, ventilationRequired: true, systemType: "VRF" }).warnings.some((warning) => warning.includes("ventilation")),
  },
  {
    id: "DEC-007",
    name: "Recommendation returns ranked options",
    passed: (() => {
      const result = recommendHVACSystems(baseInput);
      return result.options.length === 4 && result.recommendedSystem === result.options[0].systemType;
    })(),
  },
  {
    id: "DEC-008",
    name: "Recommendation includes engineering note",
    passed: recommendHVACSystems(baseInput).engineeringNote.length > 0,
  },
  {
    id: "DEC-009",
    name: "Invalid load is rejected",
    passed: (() => {
      assertThrows(() => validateSystemDecisionInput({ ...baseInput, totalCoolingLoadKw: 0 }), "Zero load should be rejected");
      return true;
    })(),
  },
  {
    id: "DEC-010",
    name: "Invalid zone count is rejected",
    passed: (() => {
      assertThrows(() => validateSystemDecisionInput({ ...baseInput, zoneCount: 0 }), "Zero zones should be rejected");
      return true;
    })(),
  },
  {
    id: "DEC-011",
    name: "Unsupported system type is rejected",
    passed: (() => {
      assertThrows(() => evaluateSystemOption({ ...baseInput, systemType: "WINDOW_AC" }), "Unsupported system should be rejected");
      return true;
    })(),
  },
  {
    id: "DEC-012",
    name: "Central plant availability improves chilled water score",
    passed: evaluateSystemOption({ ...baseInput, totalCoolingLoadKw: 150, systemType: "CHILLED_WATER", centralPlantAvailable: true }).score > evaluateSystemOption({ ...baseInput, totalCoolingLoadKw: 150, systemType: "CHILLED_WATER", centralPlantAvailable: false }).score,
  },
];

export const testSystemDecision = () => {
  const results = runSystemDecisionTests();
  const failed = results.find((result) => !result.passed);
  if (failed) throw new Error(`${failed.id}: ${failed.name}`);
  return results;
};
