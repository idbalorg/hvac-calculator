/**
 * Stage 32/33: explicit bridge from resolved reference data to engineering inputs
 * and traceability metadata for calculation results.
 */

const clone = (value) => JSON.parse(JSON.stringify(value));
const isSet = (value) => value !== null && value !== undefined;

export const applyReferenceToEngineeringInputs = (engineeringInputs = {}, resolvedReference = {}) => {
  const next = clone(engineeringInputs);
  const ref = resolvedReference.inputs || {};

  if (isSet(ref.wall?.uValueWm2K)) next.wall = { ...(next.wall || {}), uValueWm2K: ref.wall.uValueWm2K };
  if (ref.wall?.construction) next.wall = { ...(next.wall || {}), construction: ref.wall.construction };
  if (isSet(ref.windows?.uValueWm2K)) next.windows = { ...(next.windows || {}), uValueWm2K: ref.windows.uValueWm2K };
  if (isSet(ref.windows?.shgc)) next.windows = { ...(next.windows || {}), shgc: ref.windows.shgc };
  if (ref.windows?.glazing) next.windows = { ...(next.windows || {}), glazing: ref.windows.glazing };

  return {
    inputs: next,
    referenceBasis: {
      datasetVersion: resolvedReference.metadata?.referenceDatasetVersion || null,
      location: clone(resolvedReference.references?.location || null),
      occupantActivity: clone(resolvedReference.references?.occupantActivity || null),
      ventilation: clone(resolvedReference.references?.ventilation || null),
      construction: clone(resolvedReference.references?.construction || null),
      fenestration: clone(resolvedReference.references?.fenestration || null),
      appliedExplicitly: true,
      verificationRequired: true,
    },
  };
};

export const mergeReferenceBasisIntoEngineeringResult = (engineeringResult, referenceBasis) => ({
  ...engineeringResult,
  metadata: {
    ...(engineeringResult?.metadata || {}),
    referenceBasis: clone(referenceBasis || null),
  },
});

const compareField = (label, referenceValue, finalValue) => ({
  label,
  referenceValue: clone(referenceValue),
  finalValue: clone(finalValue),
  overridden: isSet(referenceValue) && String(referenceValue) !== String(finalValue),
});

/**
 * Builds report-safe traceability without changing the numerical engineering result.
 * The reference snapshot is the explicitly applied state; final inputs may differ when
 * an engineer edits a value afterwards. In that case the engineer-owned value wins.
 */
export const buildReferenceResultTrace = ({ referenceBasis = null, referenceAppliedInputs = null, finalInputs = null } = {}) => {
  if (!referenceBasis || !referenceAppliedInputs || !finalInputs) return null;

  const fields = [
    compareField("Wall U-value", referenceAppliedInputs.wall?.uValueWm2K, finalInputs.wall?.uValueWm2K),
    compareField("Wall construction", referenceAppliedInputs.wall?.construction, finalInputs.wall?.construction),
    compareField("Window U-value", referenceAppliedInputs.windows?.uValueWm2K, finalInputs.windows?.uValueWm2K),
    compareField("Window SHGC", referenceAppliedInputs.windows?.shgc, finalInputs.windows?.shgc),
    compareField("Glazing description", referenceAppliedInputs.windows?.glazing, finalInputs.windows?.glazing),
  ];

  return {
    referenceBasis: clone(referenceBasis),
    explicitApplication: referenceBasis.appliedExplicitly === true,
    overriddenFields: fields.filter((field) => field.overridden),
    fields,
    engineerOverrideWins: fields.some((field) => field.overridden),
    verificationRequired: true,
  };
};
