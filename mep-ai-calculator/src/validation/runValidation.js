import { testCase001 } from "./testCase001";

export const runValidation = () => {
  const testCases = [testCase001];
  const results = [];

  for (const testCase of testCases) {
    try {
      results.push(testCase());
    } catch (error) {
      results.push({
        id: testCase.name,
        status: "FAIL",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const passed = results.every((result) => result.status === "PASS");

  return {
    passed,
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
  `Test cases: ${validationResult.passedCount}/${validationResult.total} passed`,
);

for (const result of validationResult.results) {
  console.log(`${result.id}: ${result.status}`);
  if (result.error) console.error(`  ${result.error}`);
}
