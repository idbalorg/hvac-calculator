const assertFinite = (value, name) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
};

const assertNonNegative = (value, name) => {
  assertFinite(value, name);
  if (value < 0) throw new Error(`${name} cannot be negative`);
};

const assertPositive = (value, name) => {
  assertFinite(value, name);
  if (value <= 0) throw new Error(`${name} must be greater than zero`);
};

const assertBoolean = (value, name) => {
  if (typeof value !== "boolean") throw new Error(`${name} must be a boolean`);
};

const SYSTEMS = [
  "SPLIT_DX",
  "DUCTED_SPLIT",
  "VRF",
  "CHILLED_WATER",
];

const SYSTEM_LABELS = {
  SPLIT_DX: "Split DX",
  DUCTED_SPLIT: "Ducted Split",
  VRF: "VRF",
  CHILLED_WATER: "Chilled Water",
};

/**
 * Rule-based HVAC system recommendation engine.
 * It ranks system types from explicit project constraints. It does not
 * replace engineering judgement or manufacturer/system-specific design.
 */
export const evaluateSystemOption = ({
  systemType,
  totalCoolingLoadKw,
  floorAreaM2,
  zoneCount,
  ventilationRequired = false,
  zoningPriority = "medium",
  ceilingSpaceLimited = false,
  outdoorUnitSpaceLimited = false,
  centralPlantAvailable = false,
}) => {
  if (!SYSTEMS.includes(systemType)) throw new Error(`Unsupported systemType: ${systemType}`);
  assertPositive(totalCoolingLoadKw, "totalCoolingLoadKw");
  assertPositive(floorAreaM2, "floorAreaM2");
  if (!Number.isInteger(zoneCount) || zoneCount <= 0) throw new Error("zoneCount must be a positive integer");
  assertBoolean(ventilationRequired, "ventilationRequired");
  assertBoolean(ceilingSpaceLimited, "ceilingSpaceLimited");
  assertBoolean(outdoorUnitSpaceLimited, "outdoorUnitSpaceLimited");
  assertBoolean(centralPlantAvailable, "centralPlantAvailable");

  const reasons = [];
  const warnings = [];
  let score = 0;

  const highLoad = totalCoolingLoadKw > 100;
  const mediumLoad = totalCoolingLoadKw > 20;
  const manyZones = zoneCount >= 6;

  if (systemType === "SPLIT_DX") {
    if (highLoad) {
      score -= 5;
      warnings.push("Large connected load may make many individual split units impractical.");
    } else score += 3;
    if (manyZones) {
      score -= 2;
      warnings.push("Multiple zones can increase the number of indoor/outdoor units.");
    }
    if (outdoorUnitSpaceLimited) {
      score -= 3;
      warnings.push("Outdoor-unit space may become a constraint as unit count increases.");
    }
    if (ceilingSpaceLimited) {
      score += 1;
      reasons.push("Wall-mounted or compact indoor units can suit restricted ceiling space.");
    }
  }

  if (systemType === "DUCTED_SPLIT") {
    if (mediumLoad && !highLoad) score += 4;
    else if (highLoad) score += 1;
    else score += 2;
    if (manyZones) {
      score += 1;
      reasons.push("Ducted distribution can serve multiple spaces from a central indoor unit.");
    }
    if (ceilingSpaceLimited) {
      score -= 3;
      warnings.push("Ducted systems require space for ducts, insulation and access.");
    }
    if (ventilationRequired) reasons.push("Dedicated ventilation provisions can be coordinated with the ducted system.");
  }

  if (systemType === "VRF") {
    if (manyZones) {
      score += 6;
      reasons.push("Multiple zones favor independent indoor-unit control and modulation.");
    } else score += 3;
    if (mediumLoad) score += 2;
    if (outdoorUnitSpaceLimited) {
      score += 1;
      reasons.push("VRF can consolidate capacity into fewer outdoor-unit assemblies than many separate splits.");
    }
    if (ventilationRequired) {
      score -= 1;
      warnings.push("VRF does not by itself replace a dedicated outdoor-air/ventilation design.");
    }
  }

  if (systemType === "CHILLED_WATER") {
    if (highLoad) {
      score += 7;
      reasons.push("High connected cooling load can justify central chilled-water plant consideration.");
    } else if (mediumLoad) score += 2;
    else {
      score -= 4;
      warnings.push("Small loads may not justify central plant complexity.");
    }
    if (centralPlantAvailable) {
      score += 3;
      reasons.push("Existing or planned central-plant infrastructure improves suitability.");
    } else {
      score -= 1;
      warnings.push("Central plant, pumps, water distribution and maintenance space must be provided.");
    }
    if (ceilingSpaceLimited) warnings.push("Water piping and terminal distribution still require coordinated ceiling/service space.");
  }

  if (zoningPriority === "high" && (systemType === "VRF" || systemType === "DUCTED_SPLIT")) {
    score += 1;
    reasons.push("System supports the project's high zoning priority.");
  }

  if (zoningPriority === "low" && systemType === "SPLIT_DX") score += 1;

  return {
    systemType,
    label: SYSTEM_LABELS[systemType],
    score,
    reasons,
    warnings,
  };
};

export const recommendHVACSystems = (input) => {
  const options = SYSTEMS.map((systemType) => evaluateSystemOption({ ...input, systemType }));
  options.sort((a, b) => b.score - a.score || SYSTEMS.indexOf(a.systemType) - SYSTEMS.indexOf(b.systemType));

  const recommended = options[0];
  return {
    recommendedSystem: recommended.systemType,
    recommendedLabel: recommended.label,
    confidence: options.length > 1 && recommended.score > options[1].score ? "RELATIVE_HIGH" : "REVIEW_REQUIRED",
    options,
    engineeringNote: "Recommendation is rule-based and must be verified against project constraints, codes, manufacturer data and detailed design requirements.",
  };
};

export const validateSystemDecisionInput = ({
  totalCoolingLoadKw,
  floorAreaM2,
  zoneCount,
}) => {
  assertPositive(totalCoolingLoadKw, "totalCoolingLoadKw");
  assertPositive(floorAreaM2, "floorAreaM2");
  if (!Number.isInteger(zoneCount) || zoneCount <= 0) throw new Error("zoneCount must be a positive integer");
  return true;
};
