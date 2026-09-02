/**
 * First-layer duct design utilities.
 *
 * This module deliberately keeps design criteria explicit. It does not embed
 * unverified ASHRAE velocity or friction-rate limits. The engineer supplies
 * the target velocity and/or friction rate used for the design.
 */

const assertPositive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be positive.`);
  }
};

export const ductArea = (widthM, heightM) => {
  assertPositive(widthM, "Duct width");
  assertPositive(heightM, "Duct height");
  return widthM * heightM;
};

export const ductVelocity = (volumeFlowM3s, areaM2) => {
  if (!Number.isFinite(volumeFlowM3s) || volumeFlowM3s < 0) {
    throw new Error("Volume airflow cannot be negative.");
  }
  assertPositive(areaM2, "Duct area");
  return volumeFlowM3s / areaM2;
};

export const roundDuctDiameterByVelocity = (volumeFlowM3s, targetVelocityMps) => {
  if (!Number.isFinite(volumeFlowM3s) || volumeFlowM3s < 0) {
    throw new Error("Volume airflow cannot be negative.");
  }
  assertPositive(targetVelocityMps, "Target velocity");

  const areaM2 = volumeFlowM3s / targetVelocityMps;
  const diameterM = Math.sqrt((4 * areaM2) / Math.PI);

  return { areaM2, diameterM, velocityMps: targetVelocityMps };
};

export const rectangularDuctByVelocity = (
  volumeFlowM3s,
  widthM,
  targetVelocityMps,
) => {
  if (!Number.isFinite(volumeFlowM3s) || volumeFlowM3s < 0) {
    throw new Error("Volume airflow cannot be negative.");
  }
  assertPositive(widthM, "Duct width");
  assertPositive(targetVelocityMps, "Target velocity");

  const areaM2 = volumeFlowM3s / targetVelocityMps;
  const heightM = areaM2 / widthM;

  return {
    areaM2,
    widthM,
    heightM,
    velocityMps: targetVelocityMps,
    aspectRatio: Math.max(widthM, heightM) / Math.min(widthM, heightM),
  };
};

export const hydraulicDiameterRectangular = (widthM, heightM) => {
  const areaM2 = ductArea(widthM, heightM);
  const wettedPerimeterM = 2 * (widthM + heightM);
  return (4 * areaM2) / wettedPerimeterM;
};

export const equivalentDiameterRectangular = (widthM, heightM) => {
  assertPositive(widthM, "Duct width");
  assertPositive(heightM, "Duct height");

  // Common equivalent-diameter approximation for rectangular ducts.
  return (
    1.30 *
    Math.pow(widthM * heightM, 0.625) /
    Math.pow(widthM + heightM, 0.25)
  );
};

export const ductPressureDropFromFriction = (
  frictionRatePaPerM,
  lengthM,
) => {
  if (!Number.isFinite(frictionRatePaPerM) || frictionRatePaPerM < 0) {
    throw new Error("Friction rate cannot be negative.");
  }
  if (!Number.isFinite(lengthM) || lengthM < 0) {
    throw new Error("Duct length cannot be negative.");
  }

  return frictionRatePaPerM * lengthM;
};

export const ductSegmentDesign = ({
  volumeFlowM3s,
  widthM,
  heightM,
  lengthM = 0,
  frictionRatePaPerM = 0,
}) => {
  const areaM2 = ductArea(widthM, heightM);
  const velocityMps = ductVelocity(volumeFlowM3s, areaM2);
  const hydraulicDiameterM = hydraulicDiameterRectangular(widthM, heightM);
  const equivalentDiameterM = equivalentDiameterRectangular(widthM, heightM);
  const pressureDropPa = ductPressureDropFromFriction(
    frictionRatePaPerM,
    lengthM,
  );

  return {
    volumeFlowM3s,
    areaM2,
    widthM,
    heightM,
    velocityMps,
    hydraulicDiameterM,
    equivalentDiameterM,
    lengthM,
    frictionRatePaPerM,
    pressureDropPa,
  };
};
