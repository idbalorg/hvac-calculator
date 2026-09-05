import { calculateDxRequiredCapacity, integrateDxSystemSelection } from "../engineering/systems/dxSystemIntegration.js";

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const indoor = (overrides = {}) => ({
  id: "IND-01",
  manufacturer: "User Catalogue",
  model: "IND-01",
  type: "ceiling-cassette",
  coolingCapacityKw: 5.5,
  airflowCfm: 700,
  availableEspPa: 120,
  compatibleOutdoorUnitIds: ["OUT-01"],
  ...overrides,
});

const outdoor = (overrides = {}) => ({
  id: "OUT-01",
  manufacturer: "User Catalogue",
  model: "OUT-01",
  type: "condensing-unit",
  coolingCapacityKw: 5.5,
  ...overrides,
});

export const runDxSystemIntegrationTests = () => {
  const tests = [];
  const add = (id, name, run) => {
    try { run(); tests.push({ id, name, passed: true }); }
    catch (error) { tests.push({ id, name, passed: false, error: error.message }); }
  };

  add("DXINT-001", "Room design load sizing basis", () => {
    const result = calculateDxRequiredCapacity({ roomDesignLoadW: 5000, designMarginPercent: 10 });
    expect(result.basis === "ROOM_DESIGN_LOAD", "Room design load should be the default basis");
    expect(result.sizing.requiredCapacityKW === 5.5, "10% margin should produce 5.5 kW");
  });

  add("DXINT-002", "Coil load takes precedence when supplied", () => {
    const result = calculateDxRequiredCapacity({ roomDesignLoadW: 5000, coilTotalLoadW: 6000 });
    expect(result.basis === "COIL_TOTAL_LOAD", "Coil total load should be identified as the basis");
    expect(result.basisLoadW === 6000, "Coil total load should be used");
  });

  add("DXINT-003", "Airflow conversion to CFM", () => {
    const result = integrateDxSystemSelection({ roomDesignLoadW: 5000, requiredAirflowM3s: 0.1, indoorUnits: [], outdoorUnits: [] });
    expect(Math.abs(result.requiredAirflowCfm - 211.888) < 0.01, "m3/s should convert to CFM");
  });

  add("DXINT-004", "Suitable DX pair is selected", () => {
    const result = integrateDxSystemSelection({ roomDesignLoadW: 5000, indoorUnits: [indoor()], outdoorUnits: [outdoor()] });
    expect(result.selection.selected?.indoorUnit.id === "IND-01", "Suitable indoor unit should be selected");
    expect(result.selection.selected?.outdoorUnit.id === "OUT-01", "Compatible outdoor unit should be selected");
    expect(result.engineeringStatus === "PRELIMINARY_SELECTION", "Selection should be preliminary");
  });

  add("DXINT-005", "Airflow requirement is enforced", () => {
    const result = integrateDxSystemSelection({ roomDesignLoadW: 5000, requiredAirflowM3s: 0.5, indoorUnits: [indoor({ airflowCfm: 900 })], outdoorUnits: [outdoor()] });
    expect(result.selection.selected === null, "Insufficient airflow data/capacity should prevent selection when requirement exceeds unit airflow");
  });

  add("DXINT-006", "Oversize limit is enforced", () => {
    const result = integrateDxSystemSelection({ roomDesignLoadW: 5000, maxOversizeFraction: 0.1, indoorUnits: [indoor({ coolingCapacityKw: 6 })], outdoorUnits: [outdoor({ coolingCapacityKw: 6 })] });
    expect(result.selection.selected === null, "6 kW should fail a 5 kW load with 10% maximum oversize");
  });

  add("DXINT-007", "No valid selection is explicit", () => {
    const result = integrateDxSystemSelection({ roomDesignLoadW: 5000, indoorUnits: [], outdoorUnits: [] });
    expect(result.engineeringStatus === "NO_VALID_SELECTION", "No equipment should produce a clear status");
    expect(result.warnings.includes("NO_VALID_INDOOR_OUTDOOR_PAIR"), "No-pair warning should be retained");
    expect(result.verificationRequired === true, "Final verification must remain required");
  });

  add("DXINT-008", "ESP requirement is passed through", () => {
    const result = integrateDxSystemSelection({ roomDesignLoadW: 5000, requiredEspPa: 150, indoorUnits: [indoor()], outdoorUnits: [outdoor()] });
    expect(result.selection.selected === null, "Insufficient ESP should prevent selection");
  });

  add("DXINT-009", "Selected coverage is reported", () => {
    const result = integrateDxSystemSelection({ roomDesignLoadW: 5000, indoorUnits: [indoor()], outdoorUnits: [outdoor()] });
    expect(Math.abs(result.coverage.coverageRatio - 1.1) < 1e-9, "Coverage ratio should be reported");
    expect(Math.abs(result.coverage.excessCapacityKW - 0.5) < 1e-9, "Excess capacity should be reported");
  });

  add("DXINT-010", "Invalid load is rejected", () => {
    let failed = false;
    try { integrateDxSystemSelection({ roomDesignLoadW: 0 }); } catch { failed = true; }
    expect(failed, "Non-positive room load should be rejected");
  });

  return tests;
};
