import { testCase001 } from "./testCase001";
import { testWallLoad } from "./wallLoad.test";
import { testRoofLoad } from "./roofLoad.test";
import {
  testWindowConduction,
  testWindowSolarGain,
  testWindowCombinedLoad,
} from "./windowLoad.test";
import {
  testPeopleLoad,
  testPeopleLoadWithDiversity,
} from "./peopleLoad.test";

export const runValidation = () => {
  const tests = [
    { id: "TC-001", name: "Lagos Small Office", run: testCase001 },
    { id: "UNIT-WALL-001", name: "Opaque Wall Load", run: testWallLoad },
    { id: "UNIT-ROOF-001", name: "Roof Load", run: testRoofLoad },
    { id: "UNIT-WINDOW-001", name: "Window Conduction Load", run: testWindowConduction },
    { id: "UNIT-WINDOW-002", name: "Window Solar Gain", run: testWindowSolarGain },
    { id: "UNIT-WINDOW-003", name: "Combined Window Load", run: testWindowCombinedLoad },
    { id: "UNIT-PEOPLE-001", name: "Occupant Sensible and Latent Load", run: testPeopleLoad },
    { id: "UNIT-PEOPLE-002", name: "Occupant Diversity Load", run: testPeopleLoadWithDiversity },
  ];

  const results = tests.map(({ id, name, run }) => {
    try {
      const result = run();
      return { id, name, status: "PASS", result };
    } catch (error) {
      return {
        id,
        name,
        status: "FAIL",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return {
    passed: results.every((result) => result.status === "PASS"),
    total: results.length,
    passedCount: results.filter((result) => result.status === "PASS").length,
    failedCount: results.filter((result) => result.status === "FAIL").length,
    results,
  };
};

const validationResult = runValidation();

console.log("HVAC Engineering Validation");
console.log("===========================");
console.log(`Status: ${validationResult.passed ? "PASS" : "FAIL"}`);
console.log(`Tests: ${validationResult.passedCount}/${validationResult.total} passed`);

for (const result of validationResult.results) {
  console.log(`${result.id} | ${result.name} | ${result.status}`);
  if (result.error) console.error(`  ${result.error}`);
}

if (!validationResult.passed) {
  process.exitCode = 1;
}
