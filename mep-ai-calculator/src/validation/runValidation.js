import { testCase001 } from "./testCase001";
import { testWallLoad } from "./wallLoad.test";

export const runValidation = () => {
  const tests = [
    { id: "TC-001", name: "Lagos Small Office", run: testCase001 },
    { id: "UNIT-WALL-001", name: "Opaque Wall Load", run: testWallLoad },
  ];

  const results = tests.map(({ id, name, run }) => {
    try {
      const result = run();
      return {
        id,
        name,
        status: "PASS",
        result,
      };
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
console.log(
  `Tests: ${validationResult.passedCount}/${validationResult.total} passed`,
);

for (const result of validationResult.results) {
  console.log(`${result.id} | ${result.name} | ${result.status}`);
  if (result.error) console.error(`  ${result.error}`);
}
