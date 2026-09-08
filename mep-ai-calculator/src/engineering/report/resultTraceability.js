/**
 * Result-level engineering traceability.
 *
 * Each major calculated result is linked to its input basis, engineering
 * method, reference, result value and verification requirement. This is a
 * trace record, not a substitute for engineering review.
 */

const finite = (value) => Number.isFinite(Number(value));
const format = (value, unit) => finite(value) ? `${Number(value).toFixed(2)} ${unit}` : "Not available";

export const RESULT_BASIS = {
  COOLING_LOAD: {
    id: "RESULT-LOAD",
    discipline: "Cooling load",
    method: "Room cooling-load calculation from envelope, internal gains, ventilation and infiltration inputs",
    reference: "ASHRAE Handbook Fundamentals, cooling/heating load chapters",
    verification: "Verify room geometry, schedules, envelope properties, weather condition and calculation method against the project design basis.",
  },
  PSYCHROMETRICS: {
    id: "RESULT-PSY",
    discipline: "Psychrometrics / airside",
    method: "Psychrometric air-state and supply-airflow calculation",
    reference: "ASHRAE Handbook Fundamentals, Psychrometrics",
    verification: "Verify indoor/outdoor states, supply-air condition, coil assumptions and applicable equipment operating range.",
  },
  EQUIPMENT: {
    id: "RESULT-EQUIP",
    discipline: "Equipment selection",
    method: "Calculated room/system requirement reconciled against selected equipment capacity and airflow",
    reference: "Certified manufacturer technical data + applicable project selection criteria",
    verification: "Verify certified capacity at the actual operating condition, airflow, ESP, electrical data and approved model combination.",
  },
  DUCT: {
    id: "RESULT-DUCT",
    discipline: "Duct design",
    method: "Airflow-based duct sizing and pressure-loss calculation",
    reference: "ASHRAE Handbook Fundamentals, Duct Design + SMACNA duct-design guidance",
    verification: "Verify dimensions, fittings, construction/leakage class, acoustic criteria, critical-path pressure loss and fan capability.",
  },
};

export const buildResultTraceability = ({
  rooms = [],
  equipment = [],
  ducts = [],
  systemSummary = null,
}) => {
  const records = [];

  rooms.forEach((room) => {
    records.push({
      id: `${RESULT_BASIS.COOLING_LOAD.id}-${room.roomId ?? room.roomName}`,
      roomId: room.roomId,
      roomName: room.roomName,
      result: "Total cooling load",
      value: format(room.totalLoadKw, "kW"),
      inputBasis: "Room geometry, envelope, internal gains, ventilation/infiltration and design condition",
      ...RESULT_BASIS.COOLING_LOAD,
      status: finite(room.totalLoadKw) && Number(room.totalLoadKw) > 0 ? "CALCULATED" : "REVIEW_REQUIRED",
    });

    records.push({
      id: `${RESULT_BASIS.PSYCHROMETRICS.id}-${room.roomId ?? room.roomName}`,
      roomId: room.roomId,
      roomName: room.roomName,
      result: "Supply airflow",
      value: format(room.supplyAirflowCfm, "CFM"),
      inputBasis: "Room sensible load and selected supply-air condition",
      ...RESULT_BASIS.PSYCHROMETRICS,
      status: finite(room.supplyAirflowCfm) && Number(room.supplyAirflowCfm) > 0 ? "CALCULATED" : "REVIEW_REQUIRED",
    });
  });

  equipment.forEach((unit, index) => {
    const capacity = unit.capacityKw ?? unit.coolingCapacityKw ?? unit.capacity;
    const airflow = unit.airflowCfm ?? unit.airflow;
    records.push({
      id: `${RESULT_BASIS.EQUIPMENT.id}-${unit.id ?? unit.model ?? index + 1}`,
      roomId: unit.roomId,
      roomName: unit.roomName,
      result: "Selected equipment",
      value: [unit.model, format(capacity, "kW"), format(airflow, "CFM")].filter(Boolean).join(" | "),
      inputBasis: "Required room/system capacity and airflow compared with manufacturer equipment data",
      ...RESULT_BASIS.EQUIPMENT,
      status: unit.model || finite(capacity) ? "SELECTED_VERIFY" : "REVIEW_REQUIRED",
    });
  });

  ducts.forEach((duct, index) => {
    const widthM = duct.widthM ?? (finite(duct.widthMm) ? Number(duct.widthMm) / 1000 : null);
    const heightM = duct.heightM ?? (finite(duct.heightMm) ? Number(duct.heightMm) / 1000 : null);
    const diameterM = duct.diameterM ?? (finite(duct.diameterMm) ? Number(duct.diameterMm) / 1000 : null);
    const dimensions = diameterM !== null
      ? `Ø${(diameterM * 1000).toFixed(0)} mm`
      : `${widthM !== null ? (widthM * 1000).toFixed(0) : "?"} × ${heightM !== null ? (heightM * 1000).toFixed(0) : "?"} mm`;
    records.push({
      id: `${RESULT_BASIS.DUCT.id}-${duct.id ?? duct.ductId ?? index + 1}`,
      roomId: duct.roomId,
      roomName: duct.roomName,
      result: "Duct section",
      value: `${dimensions} | ${format(duct.airflowCfm, "CFM")}`,
      inputBasis: "Design airflow plus project duct velocity/friction criteria",
      ...RESULT_BASIS.DUCT,
      status: (diameterM !== null || (finite(widthM) && finite(heightM))) ? "CALCULATED_VERIFY" : "REVIEW_REQUIRED",
    });
  });

  if (systemSummary) {
    records.push({
      id: "RESULT-SYSTEM",
      discipline: "System selection",
      result: "System arrangement",
      value: systemSummary.systemId ?? systemSummary.systemType ?? "Selected system",
      inputBasis: "Project constraints, room requirements and equipment/distribution compatibility",
      method: "System decision and compatibility assessment",
      reference: "Project design criteria + applicable ASHRAE system-design guidance + manufacturer requirements",
      verification: "Confirm system architecture, zoning, equipment compatibility, installation constraints and approved design intent.",
      status: "SELECTED_VERIFY",
    });
  }

  return {
    methodology: "Input basis → Engineering method → Standard/reference → Result → Verification requirement",
    records,
  };
};
