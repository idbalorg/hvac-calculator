import { calculateComponentPressureDrop, calculateFanESP, sumPressureDrops } from "../engineering/airside/esp.js";
import { assertClose, assertEqual } from "./assert.js";

export const runEspTests = () => {
  const results = [];
  const run = (id, name, fn) => {
    try {
      fn();
      results.push({ id, name, passed: true });
    } catch (error) {
      results.push({ id, name, passed: false, error: error.message });
    }
  };

  run("UNIT-ESP-001", "Pressure-drop summation", () => {
    assertClose(sumPressureDrops([10, 25, 5]), 40, 1e-12, "pressure-drop sum");
  });

  run("UNIT-ESP-002", "Component pressure drop quantity", () => {
    assertClose(calculateComponentPressureDrop({ pressureDropPa: 18, quantity: 2 }), 36, 1e-12, "component loss");
  });

  run("UNIT-ESP-003", "Fan ESP without safety factor", () => {
    const result = calculateFanESP({
      criticalPathDuctPressureLossPa: 80,
      terminalPressureDropPa: 35,
      coilPressureDropPa: 50,
      filterPressureDropPa: 40,
      damperPressureDropPa: 15,
      otherPressureDropsPa: [10, 5],
    });
    assertClose(result.basePressurePa, 235, 1e-12, "base pressure");
    assertClose(result.requiredFanESP_Pa, 235, 1e-12, "required ESP");
  });

  run("UNIT-ESP-004", "Fan ESP with safety factor", () => {
    const result = calculateFanESP({
      criticalPathDuctPressureLossPa: 100,
      terminalPressureDropPa: 20,
      safetyFactor: 0.1,
    });
    assertClose(result.basePressurePa, 120, 1e-12, "base pressure");
    assertClose(result.requiredFanESP_Pa, 132, 1e-12, "required ESP");
  });

  run("UNIT-ESP-005", "Zero component losses", () => {
    const result = calculateFanESP({});
    assertEqual(result.basePressurePa, 0, "zero base pressure");
    assertEqual(result.requiredFanESP_Pa, 0, "zero required ESP");
  });

  run("UNIT-ESP-006", "Reject negative component pressure drop", () => {
    let failed = false;
    try {
      calculateFanESP({ coilPressureDropPa: -1 });
    } catch {
      failed = true;
    }
    assertEqual(failed, true, "negative pressure drop rejected");
  });

  run("UNIT-ESP-007", "Reject negative safety factor", () => {
    let failed = false;
    try {
      calculateFanESP({ safetyFactor: -0.1 });
    } catch {
      failed = true;
    }
    assertEqual(failed, true, "negative safety factor rejected");
  });

  return results;
};
