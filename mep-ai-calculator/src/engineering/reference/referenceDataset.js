/**
 * Stage 27: Engineering Reference Dataset
 *
 * Reference data is intentionally separated from calculation logic. Every
 * record carries provenance and a verification flag so the calculator can
 * distinguish sourced reference data from engineer-defined project values.
 *
 * Do not treat this catalog as a substitute for the adopted project code,
 * licensed standard tables, manufacturer data, or engineer review.
 */

export const REFERENCE_DATASET_VERSION = "1.0.0";

const clone = (value) => JSON.parse(JSON.stringify(value));
const assertString = (value, name) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${name} is required`);
};
const assertFinite = (value, name) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
};

export const REFERENCE_SOURCES = {
  ASHRAE_55_2017: {
    id: "ASHRAE_55_2017",
    title: "ANSI/ASHRAE Standard 55-2017",
    subject: "Thermal Environmental Conditions for Human Occupancy",
    sourceType: "STANDARD",
    verificationRequired: true,
  },
  ASHRAE_62_1_2022: {
    id: "ASHRAE_62_1_2022",
    title: "ANSI/ASHRAE Standard 62.1-2022",
    subject: "Ventilation and Acceptable Indoor Air Quality",
    sourceType: "STANDARD",
    verificationRequired: true,
  },
  ENGINEER_DEFINED_STARTER: {
    id: "ENGINEER_DEFINED_STARTER",
    title: "Engineer-defined starter value",
    subject: "Project reference input",
    sourceType: "ENGINEER_DEFINED",
    verificationRequired: true,
  },
};

export const LOCATION_DATASET = {
  LAGOS_IKEJA: {
    id: "LAGOS_IKEJA",
    name: "Lagos Ikeja",
    country: "Nigeria",
    station: "652010",
    designConditionId: "LAGOS_IKEJA_ASHRAE_2021",
    sourceRef: "ASHRAE_2021_FUNDAMENTALS_CH14",
    status: "REFERENCE",
    verificationRequired: true,
  },
};

export const OCCUPANT_ACTIVITY_DATASET = {
  SEATED_QUIET: {
    id: "SEATED_QUIET",
    label: "Seated, quiet",
    met: 1.0,
    sourceRef: "ASHRAE_55_2017_TABLE_5_2_1_2",
    verificationRequired: true,
  },
  OFFICE_READING: {
    id: "OFFICE_READING",
    label: "Reading, seated",
    met: 1.0,
    sourceRef: "ASHRAE_55_2017_TABLE_5_2_1_2",
    verificationRequired: true,
  },
  OFFICE_TYPING: {
    id: "OFFICE_TYPING",
    label: "Typing",
    met: 1.1,
    sourceRef: "ASHRAE_55_2017_TABLE_5_2_1_2",
    verificationRequired: true,
  },
  OFFICE_FILING_SEATED: {
    id: "OFFICE_FILING_SEATED",
    label: "Filing, seated",
    met: 1.2,
    sourceRef: "ASHRAE_55_2017_TABLE_5_2_1_2",
    verificationRequired: true,
  },
  OFFICE_FILING_STANDING: {
    id: "OFFICE_FILING_STANDING",
    label: "Filing, standing",
    met: 1.4,
    sourceRef: "ASHRAE_55_2017_TABLE_5_2_1_2",
    verificationRequired: true,
  },
};

export const VENTILATION_DATASET = {
  OFFICE_SPACE_62_1_2022: {
    id: "OFFICE_SPACE_62_1_2022",
    label: "Office space",
    standard: "ASHRAE 62.1-2022",
    occupancyCategory: "Office Buildings / Office space",
    peopleOutdoorAirCfmPerPerson: 5,
    peopleOutdoorAirLpsPerPerson: 2.5,
    areaOutdoorAirCfmPerFt2: 0.06,
    areaOutdoorAirLpsPerM2: 0.3,
    defaultOccupantDensityPer100M2: 5,
    airClass: 1,
    sourceRef: "ASHRAE_62_1_2022_TABLE_6_1",
    verificationRequired: true,
  },
  RECEPTION_62_1_2022: {
    id: "RECEPTION_62_1_2022",
    label: "Reception areas",
    standard: "ASHRAE 62.1-2022",
    occupancyCategory: "Office Buildings / Reception areas",
    peopleOutdoorAirCfmPerPerson: 5,
    peopleOutdoorAirLpsPerPerson: 2.5,
    areaOutdoorAirCfmPerFt2: 0.06,
    areaOutdoorAirLpsPerM2: 0.3,
    defaultOccupantDensityPer100M2: 30,
    airClass: 1,
    sourceRef: "ASHRAE_62_1_2022_TABLE_6_1",
    verificationRequired: true,
  },
  CONFERENCE_62_1_2022: {
    id: "CONFERENCE_62_1_2022",
    label: "Conference / meeting",
    standard: "ASHRAE 62.1-2022",
    occupancyCategory: "General / Conference/meeting",
    peopleOutdoorAirCfmPerPerson: 5,
    peopleOutdoorAirLpsPerPerson: 2.5,
    areaOutdoorAirCfmPerFt2: 0.06,
    areaOutdoorAirLpsPerM2: 0.3,
    defaultOccupantDensityPer100M2: 50,
    airClass: 1,
    sourceRef: "ASHRAE_62_1_2022_TABLE_6_1",
    verificationRequired: true,
  },
};

export const CONSTRUCTION_DATASET = {
  ENGINEER_DEFINED_MASONRY_WALL: {
    id: "ENGINEER_DEFINED_MASONRY_WALL",
    label: "Masonry wall - project-defined starter",
    surfaceType: "wall",
    uValueWPerM2K: null,
    sourceRef: "ENGINEER_DEFINED_STARTER",
    basis: "ENGINEER_DEFINED_STARTER",
    verificationRequired: true,
  },
  ENGINEER_DEFINED_ROOF: {
    id: "ENGINEER_DEFINED_ROOF",
    label: "Roof assembly - project-defined starter",
    surfaceType: "roof",
    uValueWPerM2K: null,
    sourceRef: "ENGINEER_DEFINED_STARTER",
    basis: "ENGINEER_DEFINED_STARTER",
    verificationRequired: true,
  },
};

export const FENESTRATION_DATASET = {
  ENGINEER_DEFINED_CLEAR_GLASS: {
    id: "ENGINEER_DEFINED_CLEAR_GLASS",
    label: "Clear glazing - project-defined starter",
    glazingType: "vertical_glazing",
    uValueWPerM2K: null,
    shgc: null,
    sourceRef: "ENGINEER_DEFINED_STARTER",
    basis: "ENGINEER_DEFINED_STARTER",
    verificationRequired: true,
  },
};

export const REFERENCE_DATASET = {
  version: REFERENCE_DATASET_VERSION,
  sources: REFERENCE_SOURCES,
  locations: LOCATION_DATASET,
  occupantActivities: OCCUPANT_ACTIVITY_DATASET,
  ventilation: VENTILATION_DATASET,
  constructions: CONSTRUCTION_DATASET,
  fenestration: FENESTRATION_DATASET,
};

const collectionFor = (category) => {
  const collection = REFERENCE_DATASET[category];
  if (!collection || typeof collection !== "object") throw new Error(`Unknown reference category: ${category}`);
  return collection;
};

export const getReferenceRecord = (category, id) => {
  assertString(id, "Reference id");
  const record = collectionFor(category)[id];
  if (!record) throw new Error(`Unknown ${category} reference: ${id}`);
  return clone(record);
};

export const listReferenceRecords = (category) => Object.values(collectionFor(category)).map(clone);

export const validateReferenceRecord = (record, { numericFields = [] } = {}) => {
  if (!record || typeof record !== "object") throw new Error("Reference record is required");
  assertString(record.id, "Reference record id");
  assertString(record.sourceRef, "Reference record sourceRef");
  if (record.verificationRequired !== true) throw new Error(`Reference record ${record.id} must require verification`);
  numericFields.forEach((field) => {
    if (record[field] !== null && record[field] !== undefined) assertFinite(record[field], field);
  });
  return true;
};

export const resolveVentilationReference = (id) => {
  const record = getReferenceRecord("ventilation", id);
  validateReferenceRecord(record, { numericFields: ["peopleOutdoorAirCfmPerPerson", "areaOutdoorAirCfmPerFt2"] });
  return record;
};

export const resolveOccupantActivityReference = (id) => {
  const record = getReferenceRecord("occupantActivities", id);
  validateReferenceRecord(record, { numericFields: ["met"] });
  return record;
};

export const buildReferenceSelection = ({ locationId, occupancyActivityId, ventilationId, constructionId = null, fenestrationId = null }) => {
  const selection = {
    location: locationId ? getReferenceRecord("locations", locationId) : null,
    occupantActivity: occupancyActivityId ? resolveOccupantActivityReference(occupancyActivityId) : null,
    ventilation: ventilationId ? resolveVentilationReference(ventilationId) : null,
    construction: constructionId ? getReferenceRecord("constructions", constructionId) : null,
    fenestration: fenestrationId ? getReferenceRecord("fenestration", fenestrationId) : null,
  };
  return clone(selection);
};
