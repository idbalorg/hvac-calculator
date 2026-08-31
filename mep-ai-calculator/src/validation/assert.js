export const assertClose = (actual, expected, tolerance, label) => {
  const difference = Math.abs(actual - expected);

  if (difference > tolerance) {
    throw new Error(
      `${label} failed: expected ${expected}, got ${actual} (difference ${difference})`,
    );
  }

  return { label, actual, expected, difference, passed: true };
};

export const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label} failed: expected ${expected}, got ${actual}`);
  }

  return { label, actual, expected, difference: 0, passed: true };
};

export const runAssertions = (assertions) => {
  const results = assertions.map((assertion) => assertion());
  return {
    passed: results.every((result) => result.passed),
    results,
  };
};
