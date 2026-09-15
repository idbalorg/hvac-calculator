/**
 * Engineering standards and traceability.
 *
 * This module records the engineering basis used by the workflow. It does not
 * hard-code universal design limits. Project criteria, manufacturer data and
 * applicable code editions remain explicit inputs/verification items.
 */

export const ENGINEERING_BASIS = {
  COOLING_LOAD: {
    id: "LOAD-001",
    discipline: "Cooling load",
    input: "Envelope, internal gains, ventilation and infiltration inputs",
    method: "Applicable ASHRAE cooling-load calculation method",
    reference: "ASHRAE Handbook Fundamentals, cooling/heating load chapters",
    verification: "Confirm project inputs, schedules, construction properties and selected ASHRAE method/edition.",
  },
  DESIGN_CONDITION: {
    id: "COND-001",
    discipline: "Design conditions",
    input: "Outdoor design condition / cooling design percentile",
    method: "ASHRAE climatic design data",
    reference: "ASHRAE Handbook Fundamentals, Climatic Design Information",
    verification: "Confirm location, design percentile and project-adopted weather/design condition.",
  },
  FENESTRATION: {
    id: "ENV-001",
    discipline: "Envelope / fenestration",
    input: "Window properties, area, orientation and shading",
    method: "Building-envelope and fenestration heat-gain calculation",
    reference: "ASHRAE Handbook Fundamentals, Fenestration",
    verification: "Verify against architectural/window schedule and approved construction data.",
  },
  VENTILATION: {
    id: "VENT-001",
    discipline: "Ventilation",
    input: "Occupancy, space type and outdoor airflow requirement",
    method: "Ventilation-rate procedure / applicable project ventilation method",
    reference: "ASHRAE Standard 62.1 for applicable nonresidential spaces",
    verification: "Confirm occupancy, space classification, outdoor-air rates and applicable edition.",
  },
  PSYCHROMETRICS: {
    id: "PSY-001",
    discipline: "Psychrometrics",
    input: "Indoor/outdoor dry-bulb, humidity and supply/coil leaving conditions",
    method: "Psychrometric relationships and air-state analysis",
    reference: "ASHRAE Handbook Fundamentals, Psychrometrics",
    verification: "Confirm adopted indoor criteria, outdoor condition and coil/supply-air assumptions.",
  },
  AIR_DIFFUSION: {
    id: "AIR-001",
    discipline: "Air distribution",
    input: "Supply airflow, terminal arrangement and diffuser/grille data",
    method: "Space air diffusion and terminal selection",
    reference: "ASHRAE Handbook Fundamentals, Space Air Diffusion",
    verification: "Verify terminal manufacturer data, throw/NC requirements and coordinated ceiling layout.",
  },
  DUCT_DESIGN: {
    id: "DUCT-001",
    discipline: "Duct design",
    input: "Airflow plus project velocity/friction criteria",
    method: "Duct sizing and pressure-loss calculation",
    reference: "ASHRAE Handbook Fundamentals, Duct Design + SMACNA duct design guidance",
    verification: "Confirm project duct criteria, fittings, construction class, leakage requirements and fan/system pressure loss.",
  },
  EQUIPMENT: {
    id: "EQUIP-001",
    discipline: "Equipment selection",
    input: "Required capacity, airflow, ESP and operating conditions",
    method: "Manufacturer-certified equipment selection against calculated requirements",
    reference: "Manufacturer technical data + applicable ASHRAE/system design guidance",
    verification: "Use current certified schedule/data sheet and verify operating point, electrical data and installation conditions.",
  },
  REFRIGERATION: {
    id: "REF-001",
    discipline: "Refrigeration",
    input: "Refrigerant, piping, installation and safety requirements",
    method: "Manufacturer installation requirements and applicable refrigeration safety provisions",
    reference: "ASHRAE Standard 15 + equipment manufacturer requirements",
    verification: "Confirm refrigerant designation, charge/limits, pipe sizing, equivalent length and safety requirements for the applicable edition.",
  },
  MEASUREMENT: {
    id: "TEST-001",
    discipline: "Testing / commissioning",
    input: "Measured airflow, ESP, capacity and operating data",
    method: "Field measurement, TAB and commissioning verification",
    reference: "ASHRAE measurement/instrumentation guidance + project TAB/commissioning requirements",
    verification: "Record calibrated instruments, test conditions, measured values, deviations and corrective actions.",
  },
};

const uniq = (items) => [...new Set(items.filter(Boolean))];

export const buildStandardsTraceability = ({
  rooms = [],
  equipment = [],
  ducts = [],
  projectCriteria = {},
  systemSummary = null,
}) => {
  const rows = [
    ENGINEERING_BASIS.COOLING_LOAD,
    ENGINEERING_BASIS.DESIGN_CONDITION,
    ENGINEERING_BASIS.FENESTRATION,
    ENGINEERING_BASIS.PSYCHROMETRICS,
    ENGINEERING_BASIS.EQUIPMENT,
  ];

  const ventilationRequired = rooms.some((room) => room.outdoorAirflowCfm > 0 || room.dedicatedVentilationRequired === true)
    || projectCriteria.ventilationRequired === true;
  if (ventilationRequired) rows.push(ENGINEERING_BASIS.VENTILATION);

  if (rooms.some((room) => room.supplyAirflowCfm > 0)) rows.push(ENGINEERING_BASIS.AIR_DIFFUSION);
  if (ducts.length > 0) rows.push(ENGINEERING_BASIS.DUCT_DESIGN);

  const hasRefrigerant = equipment.some((unit) => unit.refrigerant || /DX|VRF|REFRIG/i.test(`${unit.type || ""} ${unit.systemId || ""}`));
  if (hasRefrigerant) rows.push(ENGINEERING_BASIS.REFRIGERATION);

  if (projectCriteria.commissioningRequired === true || projectCriteria.measuredDataAvailable === true) rows.push(ENGINEERING_BASIS.MEASUREMENT);

  const traceability = rows.map((basis) => ({
    ...basis,
    status: "BASIS_RECORDED",
    evidence: uniq([
      basis.id === "LOAD-001" && rooms.length ? `${rooms.length} room cooling-load result(s)` : null,
      basis.id === "EQUIP-001" && equipment.length ? `${equipment.length} selected equipment item(s)` : null,
      basis.id === "DUCT-001" && ducts.length ? `${ducts.length} duct section(s)` : null,
      basis.id === "VENT-001" && ventilationRequired ? "Ventilation requirement identified" : null,
      basis.id === "AIR-001" && rooms.length ? "Room supply-airflow results" : null,
      systemSummary?.systemId && basis.id === "EQUIP-001" ? `System ${systemSummary.systemId}` : null,
    ]),
  }));

  return {
    methodology: "Input → Engineering method → Standard/reference → Calculation → Result → Verification requirement",
    traceability,
    projectCriteria: {
      ventilationRequired: Boolean(projectCriteria.ventilationRequired),
      commissioningRequired: Boolean(projectCriteria.commissioningRequired),
      measuredDataAvailable: Boolean(projectCriteria.measuredDataAvailable),
    },
    disclaimer: "References identify the engineering basis. They do not replace project-specific code review, adopted editions, manufacturer data, or engineer verification.",
  };
};
