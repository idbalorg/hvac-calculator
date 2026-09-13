/**
 * Stage 32: Explicit bridge from resolved reference data to cooling-load inputs.
 *
 * Reference values are applied only when an engineer explicitly selects a
 * reference. Missing reference properties never overwrite an existing value.
 * Provenance is retained separately from the numerical inputs.
 */

const clone = (value) => JSON.parse(JSON.stringify(value));

export const applyReferenceToEngineeringInputs = (engineeringInputs = {}, resolvedReference = {}) => {
  const next = clone(engineeringInputs);
  const ref = resolvedReference.inputs || {};

  if (ref.wall?.uValueWm2K !== null && ref.wall?.uValueWm2K !== undefined) {
    next.wall = { ...(next.wall || {}), uValueWm2K: ref.wall.uValueWm2K };
  }
  if (ref.wall?.construction) {
    next.wall = { ...(next.wall || {}), construction: ref.wall.construction };
  }

  if (ref.windows?.uValueWm2K !== null && ref.windows?.uValueWm2K !== undefined) {
    next.windows = { ...(next.windows || {}), uValueWm2K: ref.windows.uValueWm2K };
  }
  if (ref.windows?.shgc !== null && ref.windows?.shgc !== undefined) {
    next.windows = { ...(next.windows || {}), shgc: ref.windows.shgc };
  }
  if (ref.windows?.glazing) {
    next.windows = { ...(next.windows || {}), glazing: ref.windows.glazing };
  }

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
