/**
 * Stage 35: controlled integration adapter for calculator/report traceability.
 *
 * This module deliberately keeps reference provenance separate from numerical
 * load calculations. It creates report-ready traces only for rooms where the
 * reference bridge was explicitly applied.
 */
import { applyReferenceToEngineeringInputs, buildReferenceResultTrace } from "./referenceCalculationBridge.js";

const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

export const buildReferenceTraceForRoom = ({
  engineeringInputs = null,
  resolvedReference = null,
  appliedReferenceInputs = null,
} = {}) => {
  if (!engineeringInputs || !resolvedReference) return null;

  const applied = appliedReferenceInputs || applyReferenceToEngineeringInputs(
    engineeringInputs,
    resolvedReference,
  );

  return buildReferenceResultTrace({
    referenceBasis: applied.referenceBasis,
    referenceAppliedInputs: applied.inputs,
    finalInputs: engineeringInputs,
  });
};

/**
 * Build traces keyed by room ID for the calculator result/report layer.
 * Missing or un-applied references remain null and never acquire provenance
 * merely because a reference was selected.
 */
export const buildReferenceTraceByRoom = ({
  roomIds = [],
  engineeringByRoom = {},
  resolvedReferenceByRoom = {},
  appliedReferenceInputsByRoom = {},
} = {}) => Object.fromEntries(roomIds.map((roomId) => [
  roomId,
  clone(buildReferenceTraceForRoom({
    engineeringInputs: engineeringByRoom[roomId],
    resolvedReference: resolvedReferenceByRoom[roomId],
    appliedReferenceInputs: appliedReferenceInputsByRoom[roomId],
  })),
]));
