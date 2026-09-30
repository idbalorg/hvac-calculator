const SEVERITY_WEIGHT = { CRITICAL: 5, HIGH: 4, MEDIUM: 2, LOW: 1 };

const exception = ({ id, severity, scope, check, message, action }) => ({
  id,
  severity,
  scope,
  check,
  message,
  recommendedAction: action,
});

const mapReviewToException = (scope, check, result, index) => {
  if (!result || result.status !== "REVIEW_REQUIRED") return null;

  const key = `${scope}-${check}`.toLowerCase();
  const critical = /cooling load|capacity|system arrangement/.test(key);
  const high = /airflow|duct|esp|refrigerant|weather|operating condition/.test(key);
  const severity = critical ? "CRITICAL" : high ? "HIGH" : "MEDIUM";

  const actionMap = {
    "cooling load": "Complete and verify the room cooling-load inputs and calculation before equipment approval.",
    "supply airflow": "Verify the design supply airflow from the psychrometric calculation and terminal/system selection.",
    ventilation: "Confirm required outdoor airflow and verify the adopted ventilation basis.",
    capacity: "Review equipment selection and confirm selected capacity meets the calculated design requirement.",
    airflow: "Confirm manufacturer airflow data meets the calculated design airflow at the intended operating condition.",
    esp: "Verify calculated system resistance and manufacturer fan ESP at the design airflow.",
    "manufacturer data": "Obtain the approved manufacturer data sheet and confirm model, capacity and airflow ratings.",
    "duct completeness": "Complete the duct network calculation, dimensions and pressure-loss schedule for all ducted branches.",
    "weather design condition": "Verify the adopted outdoor design condition against the approved weather source and project design basis.",
    "operating condition": "Confirm the equipment operating condition, including design entering/leaving air conditions and applicable rating basis.",
    "acoustic criteria": "Confirm project acoustic criteria and verify selected equipment/terminals against the project requirement.",
    "refrigerant piping": "Verify refrigerant, pipe sizing, pipe lengths, elevation differences and installation requirements using manufacturer data and the adopted safety standard.",
    "system arrangement": "Review upstream system selection checks and resolve the identified system-level issue before design approval.",
  };

  const action = Object.entries(actionMap).find(([term]) => key.includes(term))?.[1] || "Review the engineering evidence for this check and document the resolution before approval.";
  return exception({ id: `EXC-${String(index + 1).padStart(3, "0")}`, severity, scope, check, message: result.message, action });
};

export const buildEngineeringDecision = ({ engineeringReview }) => {
  if (!engineeringReview || typeof engineeringReview !== "object") throw new Error("engineeringReview is required");

  const exceptions = [];
  const add = (scope, check, result) => {
    const item = mapReviewToException(scope, check, result, exceptions.length);
    if (item) exceptions.push(item);
  };

  for (const room of engineeringReview.roomChecks || []) {
    add(room.roomId, "Cooling load", room.coolingLoad);
    add(room.roomId, "Supply airflow", room.supplyAirflow);
    add(room.roomId, "Ventilation", room.ventilation);
  }
  for (const unit of engineeringReview.equipmentChecks || []) {
    add(unit.equipmentId, "Capacity", unit.capacity);
    add(unit.equipmentId, "Airflow", unit.airflow);
    add(unit.equipmentId, "ESP", unit.esp);
    add(unit.equipmentId, "Manufacturer data", unit.manufacturerData);
  }
  for (const [check, result] of Object.entries(engineeringReview.projectChecks || {})) add("Project", check.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), result);

  const weighted = exceptions.reduce((sum, item) => sum + (SEVERITY_WEIGHT[item.severity] || 0), 0);
  const readinessScore = Math.max(0, Math.min(100, 100 - weighted * 5));
  const criticalCount = exceptions.filter((item) => item.severity === "CRITICAL").length;
  const highCount = exceptions.filter((item) => item.severity === "HIGH").length;
  const mediumCount = exceptions.filter((item) => item.severity === "MEDIUM").length;
  const lowCount = exceptions.filter((item) => item.severity === "LOW").length;

  const status = criticalCount > 0 ? "BLOCKED" : exceptions.length > 0 ? "REVIEW_REQUIRED" : "READY_FOR_ENGINEERING_APPROVAL";

  return {
    version: "1.0",
    status,
    readinessScore,
    summary: {
      exceptionCount: exceptions.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    },
    exceptions,
    methodology: "Engineering review result → exception severity → recommended corrective action → design readiness decision",
    boundary: "The readiness score is a workflow prioritization aid, not a code-compliance percentage or substitute for engineer-of-record approval. BLOCKED identifies critical unresolved review items. REVIEW_REQUIRED identifies outstanding evidence or verification. Final approval remains an engineering responsibility.",
  };
};
