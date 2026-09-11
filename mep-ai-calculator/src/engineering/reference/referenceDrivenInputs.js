/** Stage 28: reference-driven engineering inputs.
 * Resolves selected reference records into calculator-ready inputs while
 * preserving provenance. It never invents missing construction/fenestration data.
 */
import { buildReferenceSelection, REFERENCE_DATASET_VERSION } from "./referenceDataset.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const finiteOr = (value, fallback = null) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const buildReferenceDrivenInputs = ({
  locationId = null,
  occupancyActivityId = null,
  ventilationId = null,
  constructionId = null,
  fenestrationId = null,
  engineerOverrides = {},
} = {}) => {
  const references = buildReferenceSelection({ locationId, occupancyActivityId, ventilationId, constructionId, fenestrationId });
  const ventilation = references.ventilation;
  const activity = references.occupantActivity;
  const construction = references.construction;
  const fenestration = references.fenestration;

  const inputs = {
    people: {
      sensibleHeatWPerPerson: engineerOverrides.people?.sensibleHeatWPerPerson ?? null,
      latentHeatWPerPerson: engineerOverrides.people?.latentHeatWPerPerson ?? null,
      diversityFactor: engineerOverrides.people?.diversityFactor ?? 1,
      activity: activity?.label ?? null,
      activityMet: activity?.met ?? null,
    },
    ventilation: {
      enabled: Boolean(ventilation),
      outdoorAirPerPersonLps: finiteOr(ventilation?.peopleOutdoorAirLpsPerPerson, 0),
      outdoorAirPerAreaLpsM2: finiteOr(ventilation?.areaOutdoorAirLpsPerM2, 0),
      effectiveness: engineerOverrides.ventilation?.effectiveness ?? 1,
      standard: ventilation?.standard ?? null,
      zoneCategory: ventilation?.occupancyCategory ?? null,
    },
    wall: {
      uValueWm2K: construction?.surfaceType === "wall" ? construction.uValueWPerM2K : null,
      construction: construction?.label ?? null,
    },
    windows: {
      uValueWm2K: fenestration?.uValueWPerM2K ?? null,
      shgc: fenestration?.shgc ?? null,
      glazing: fenestration?.label ?? null,
    },
  };

  return clone({
    inputs,
    references,
    metadata: {
      referenceDatasetVersion: REFERENCE_DATASET_VERSION,
      resolvedAt: new Date().toISOString(),
      engineerOverridesApplied: Object.keys(engineerOverrides).length > 0,
    },
  });
};

export const getReferenceCompleteness = (resolved) => {
  const checks = {
    location: Boolean(resolved?.references?.location),
    occupantActivity: Boolean(resolved?.references?.occupantActivity),
    ventilation: Boolean(resolved?.references?.ventilation),
    construction: Boolean(resolved?.references?.construction),
    fenestration: Boolean(resolved?.references?.fenestration),
  };
  const complete = Object.values(checks).filter(Boolean).length;
  return { ...checks, completeCount: complete, total: 5, complete: complete === 5 };
};
