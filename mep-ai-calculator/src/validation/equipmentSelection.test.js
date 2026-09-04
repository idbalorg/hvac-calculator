import { normalizeEquipmentCatalogue, validateEquipmentRecord } from "../engineering/equipment/equipmentCatalogue.js";
import {
  evaluateEquipmentCandidate,
  selectEquipment,
  selectEquipmentPair,
  validateEquipmentPair,
} from "../engineering/equipment/equipmentSelection.js";

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const baseUnit = (overrides = {}) => ({
  id: "UNIT-01",
  manufacturer: "Test Manufacturer",
  model: "TEST-01",
  type: "ceiling-cassette",
  coolingCapacityKw: 5,
  airflowCfm: 650,
  availableEspPa: 120,
  ...overrides,
});

export const runEquipmentSelectionTests = () => {
  const tests = [];
  const add = (id, name, run) => {
    try { run(); tests.push({ id, name, passed: true }); }
    catch (error) { tests.push({ id, name, passed: false, error: error.message }); }
  };

  add("EQUIP-001", "Valid catalogue record", () => {
    const result = validateEquipmentRecord(baseUnit());
    expect(result.id === "UNIT-01", "Valid equipment should be returned");
  });

  add("EQUIP-002", "Invalid capacity rejected", () => {
    let failed = false;
    try { validateEquipmentRecord(baseUnit({ coolingCapacityKw: -1 })); } catch { failed = true; }
    expect(failed, "Negative capacity must be rejected");
  });

  add("EQUIP-003", "Catalogue normalization", () => {
    const result = normalizeEquipmentCatalogue([baseUnit(), baseUnit({ id: "UNIT-02" })]);
    expect(result.length === 2, "Two valid units should be normalized");
  });

  add("EQUIP-004", "Exact capacity selection", () => {
    const result = selectEquipment({ requiredCapacityKw: 5, equipment: [baseUnit()] });
    expect(result.selected?.equipment.id === "UNIT-01", "Exact capacity should be selected");
    expect(result.selected?.capacityPass === true, "Exact capacity should pass");
  });

  add("EQUIP-005", "Acceptable oversize selection", () => {
    const result = selectEquipment({
      requiredCapacityKw: 5,
      maxOversizeFraction: 0.2,
      equipment: [baseUnit({ id: "UNIT-06", coolingCapacityKw: 6 })],
    });
    expect(result.selected?.equipment.id === "UNIT-06", "6 kW should be accepted for 20% maximum oversize");
  });

  add("EQUIP-006", "Undersized candidates rejected", () => {
    const result = selectEquipment({ requiredCapacityKw: 5, equipment: [baseUnit({ coolingCapacityKw: 4 })] });
    expect(result.selected === null, "Undersized unit must not be selected");
    expect(result.evaluated[0].reasons.includes("UNDERSIZED"), "Undersized reason should be reported");
  });

  add("EQUIP-007", "Excessive oversize rejected", () => {
    const result = selectEquipment({ requiredCapacityKw: 5, maxOversizeFraction: 0.15, equipment: [baseUnit({ coolingCapacityKw: 6 })] });
    expect(result.selected === null, "Excessively oversized unit must not be selected");
    expect(result.evaluated[0].reasons.includes("EXCESSIVE_OVERSIZE"), "Oversize warning should be reported");
  });

  add("EQUIP-008", "Insufficient airflow rejected", () => {
    const result = selectEquipment({ requiredCapacityKw: 5, requiredAirflowCfm: 700, equipment: [baseUnit({ airflowCfm: 600 })] });
    expect(result.selected === null, "Insufficient airflow unit must not be selected");
    expect(result.evaluated[0].reasons.includes("INSUFFICIENT_AIRFLOW"), "Airflow warning should be reported");
  });

  add("EQUIP-009", "Insufficient ESP rejected", () => {
    const result = selectEquipment({ requiredCapacityKw: 5, requiredEspPa: 150, equipment: [baseUnit({ availableEspPa: 120 })] });
    expect(result.selected === null, "Insufficient ESP unit must not be selected");
    expect(result.evaluated[0].reasons.includes("INSUFFICIENT_ESP"), "ESP warning should be reported");
  });

  add("EQUIP-010", "Deterministic best-fit ranking", () => {
    const result = selectEquipment({
      requiredCapacityKw: 5,
      equipment: [
        baseUnit({ id: "UNIT-07", coolingCapacityKw: 6 }),
        baseUnit({ id: "UNIT-05", coolingCapacityKw: 5.2 }),
        baseUnit({ id: "UNIT-06", coolingCapacityKw: 5.5 }),
      ],
    });
    expect(result.selected?.equipment.id === "UNIT-05", "Smallest acceptable excess capacity should rank first");
  });

  add("EQUIP-011", "Compatible indoor outdoor pair", () => {
    const indoor = baseUnit({ id: "IND-01", compatibleOutdoorUnitIds: ["OUT-01"] });
    const outdoor = baseUnit({ id: "OUT-01", type: "condensing-unit" });
    const result = validateEquipmentPair({ indoorUnit: indoor, outdoorUnit: outdoor });
    expect(result.compatible === true, "Explicitly matched units should be compatible");
  });

  add("EQUIP-012", "Incompatible pair rejected", () => {
    const indoor = baseUnit({ id: "IND-01", compatibleOutdoorUnitIds: ["OUT-02"] });
    const outdoor = baseUnit({ id: "OUT-01", type: "condensing-unit" });
    const result = validateEquipmentPair({ indoorUnit: indoor, outdoorUnit: outdoor });
    expect(result.compatible === false, "Unmatched units must be rejected");
    expect(result.reasons.includes("INCOMPATIBLE_INDOOR_OUTDOOR_PAIR"), "Pair incompatibility reason should be reported");
  });

  add("EQUIP-013", "No valid pair returns structured warning", () => {
    const result = selectEquipmentPair({
      requiredCapacityKw: 5,
      indoorUnits: [baseUnit({ id: "IND-01", compatibleOutdoorUnitIds: ["OUT-02"] })],
      outdoorUnits: [baseUnit({ id: "OUT-01", type: "condensing-unit" })],
    });
    expect(result.selected === null, "No compatible pair should be selected");
    expect(result.warnings.includes("NO_VALID_INDOOR_OUTDOOR_PAIR"), "No-pair warning should be structured");
  });

  add("EQUIP-014", "Missing airflow data is surfaced", () => {
    const result = evaluateEquipmentCandidate({
      equipment: baseUnit({ airflowCfm: undefined }),
      requiredCapacityKw: 5,
      requiredAirflowCfm: 650,
    });
    expect(result.acceptable === false, "Missing required airflow data must prevent acceptance");
    expect(result.reasons.includes("MISSING_AIRFLOW_DATA"), "Missing airflow data reason should be reported");
  });

  return tests;
};
