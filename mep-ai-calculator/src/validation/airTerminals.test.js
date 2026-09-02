import { validateAirTerminal } from "../engineering/airside/airTerminals.js";
import { selectAirTerminal, calculateTerminalFaceVelocity, calculateReturnAirflow } from "../engineering/airside/terminalSelection.js";
import { assertClose, assertEqual } from "./assert.js";

export const runAirTerminalTests = () => {
  const results = [];
  const run = (id, name, fn) => {
    try { fn(); results.push({ id, name, passed: true }); }
    catch (error) { results.push({ id, name, passed: false, error: error.message }); }
  };

  const catalogue = [
    { id: "CD-A", type: "ceiling_diffuser", minAirflowCfm: 200, maxAirflowCfm: 450, pressureDropPa: 20, throwM: 4 },
    { id: "CD-B", type: "ceiling_diffuser", minAirflowCfm: 300, maxAirflowCfm: 600, pressureDropPa: 25, throwM: 5 },
  ];

  run("UNIT-TERM-001", "Air terminal validation", () => {
    assertEqual(validateAirTerminal(catalogue[0]), true, "terminal validation");
  });

  run("UNIT-TERM-002", "Terminal selection by airflow", () => {
    const result = selectAirTerminal({ requiredAirflowCfm: 878, numberOfTerminals: 2, terminals: catalogue });
    assertEqual(result.suitable, true, "suitable terminal");
    assertClose(result.airflowPerTerminalCfm, 439, 1e-12, "airflow per terminal");
    assertEqual(result.selected.id, "CD-A", "selected terminal");
  });

  run("UNIT-TERM-003", "Terminal selection ranks smallest suitable capacity", () => {
    const result = selectAirTerminal({ requiredAirflowCfm: 900, numberOfTerminals: 2, terminals: catalogue });
    assertEqual(result.selected.id, "CD-A", "smallest suitable terminal");
  });

  run("UNIT-TERM-004", "No suitable terminal condition", () => {
    const result = selectAirTerminal({ requiredAirflowCfm: 1400, numberOfTerminals: 2, terminals: catalogue });
    assertEqual(result.suitable, false, "no suitable terminal");
    assertEqual(result.selected, null, "selected terminal should be null");
  });

  run("UNIT-TERM-005", "Throw requirement filters terminals", () => {
    const result = selectAirTerminal({ requiredAirflowCfm: 878, numberOfTerminals: 2, requiredThrowM: 4.5, terminals: catalogue });
    assertEqual(result.selected.id, "CD-B", "throw-compatible terminal");
  });

  run("UNIT-TERM-006", "Terminal face velocity", () => {
    const velocity = calculateTerminalFaceVelocity({ airflowCfm: 423.776, faceAreaM2: 0.36 });
    assertClose(velocity, 423.776 / 2118.88 / 0.36, 1e-12, "face velocity");
  });

  run("UNIT-TERM-007", "Return airflow after transfer airflow", () => {
    assertClose(calculateReturnAirflow({ supplyAirflowCfm: 878, transferAirflowCfm: 100 }), 778, 1e-12, "return airflow");
  });

  return results;
};
