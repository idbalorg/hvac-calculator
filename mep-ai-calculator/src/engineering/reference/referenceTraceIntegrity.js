/**
 * Stage 38: integrity checks for controlled reference traceability.
 *
 * This module validates the trace already produced by the reference result
 * integration layer. It does not change engineering inputs or calculations.
 */

const isSet = (value) => value !== null && value !== undefined;
const sameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const FIELD_MAP = [
  ["Wall U-value", "wall", "uValueWm2K"],
  ["Wall construction", "wall", "construction"],
  ["Window U-value", "windows", "uValueWm2K"],
  ["Window SHGC", "windows", "shgc"],
  ["Glazing description", "windows", "glazing"],
];

export const validateReferenceTraceIntegrity = ({
  trace = null,
  appliedReference = null,
  finalInputs = null,
} = {}) => {
  const errors = [];

  if (!trace) return { passed: appliedReference == null, errors: appliedReference == null ? [] : ["Trace is missing for an applied reference"] };
  if (!appliedReference?.referenceBasis || !appliedReference?.inputs) errors.push("Applied reference snapshot is incomplete");
  if (!finalInputs) errors.push("Final engineering inputs are missing");

  if (trace.explicitApplication !== true) errors.push("Trace is not marked as an explicit application");
  if (trace.referenceBasis?.appliedExplicitly !== true) errors.push("Reference basis is not marked as explicitly applied");
  if (trace.verificationRequired !== true) errors.push("Trace must retain verificationRequired=true");

  const expectedFields = (appliedReference?.inputs && finalInputs)
    ? FIELD_MAP.map(([label, section, key]) => ({
      label,
      referenceValue: appliedReference.inputs?.[section]?.[key],
      finalValue: finalInputs?.[section]?.[key],
      overridden: isSet(appliedReference.inputs?.[section]?.[key]) && String(appliedReference.inputs?.[section]?.[key]) !== String(finalInputs?.[section]?.[key]),
    }))
    : [];

  if (expectedFields.length) {
    for (const expected of expectedFields) {
      const actual = trace.fields?.find((field) => field.label === expected.label);
      if (!actual) {
        errors.push(`Missing trace field: ${expected.label}`);
        continue;
      }
      if (!sameValue(actual.referenceValue, expected.referenceValue)) errors.push(`Reference value mismatch: ${expected.label}`);
      if (!sameValue(actual.finalValue, expected.finalValue)) errors.push(`Final value mismatch: ${expected.label}`);
      if (actual.overridden !== expected.overridden) errors.push(`Override flag mismatch: ${expected.label}`);
    }

    const expectedOverrides = expectedFields.filter((field) => field.overridden).map((field) => field.label);
    const actualOverrides = (trace.overriddenFields || []).map((field) => field.label);
    if (!sameValue(actualOverrides, expectedOverrides)) errors.push("Overridden field list does not match final engineering inputs");
    if (trace.engineerOverrideWins !== (expectedOverrides.length > 0)) errors.push("engineerOverrideWins does not match override state");
  }

  if (trace.referenceBasis?.datasetVersion !== appliedReference?.referenceBasis?.datasetVersion) errors.push("Dataset version provenance mismatch");
  if (!sameValue(trace.referenceBasis?.location, appliedReference?.referenceBasis?.location)) errors.push("Location provenance mismatch");
  if (!sameValue(trace.referenceBasis?.occupantActivity, appliedReference?.referenceBasis?.occupantActivity)) errors.push("Occupant activity provenance mismatch");
  if (!sameValue(trace.referenceBasis?.ventilation, appliedReference?.referenceBasis?.ventilation)) errors.push("Ventilation provenance mismatch");

  return { passed: errors.length === 0, errors };
};
