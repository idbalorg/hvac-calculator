const assertObject = (value, name) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
};

const assertArray = (value, name) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} must contain at least one item`);
  }
};

/**
 * Orchestrates the engineering stages into one traceable design package.
 * Each stage remains independently testable and the orchestrator does not
 * invent engineering values or manufacturer data.
 */
export const runDesignWorkflow = ({
  project,
  rooms,
  roomLoadResults,
  airsideResults,
  systemRequirements,
  equipmentSelections,
  ductResults,
  systemSummary = null,
  criteria,
  generatedAt = null,
  reportBuilder,
}) => {
  assertObject(project, "project");
  assertArray(rooms, "rooms");
  assertArray(roomLoadResults, "roomLoadResults");
  assertArray(airsideResults, "airsideResults");
  assertObject(systemRequirements, "systemRequirements");
  assertArray(equipmentSelections, "equipmentSelections");
  assertArray(ductResults, "ductResults");
  assertObject(criteria, "criteria");
  if (typeof reportBuilder !== "function") throw new Error("reportBuilder is required");

  const report = reportBuilder({
    project,
    rooms,
    equipment: equipmentSelections,
    ducts: ductResults,
    systemSummary,
    criteria,
    generatedAt,
  });

  return {
    workflowVersion: "1.0",
    project,
    inputs: {
      roomCount: rooms.length,
      roomLoadCount: roomLoadResults.length,
      airsideCount: airsideResults.length,
      equipmentCount: equipmentSelections.length,
      ductCount: ductResults.length,
    },
    requirements: systemRequirements,
    report,
    status: report.validation.passed ? "PASS" : "FAIL",
  };
};

export const buildEngineeringAudit = ({
  workflow,
  requiredStages = [
    "roomLoads",
    "airside",
    "systemRequirements",
    "equipmentSelection",
    "ductDesign",
    "report",
  ],
}) => {
  assertObject(workflow, "workflow");
  assertArray(requiredStages, "requiredStages");

  const stageAvailability = {
    roomLoads: workflow.inputs?.roomLoadCount > 0,
    airside: workflow.inputs?.airsideCount > 0,
    systemRequirements: Boolean(workflow.requirements),
    equipmentSelection: workflow.inputs?.equipmentCount > 0,
    ductDesign: workflow.inputs?.ductCount > 0,
    report: Boolean(workflow.report),
  };

  const missingStages = requiredStages.filter((stage) => !stageAvailability[stage]);
  const engineeringStatus = workflow.status === "PASS" && missingStages.length === 0 ? "PASS" : "FAIL";

  return {
    status: engineeringStatus,
    stageAvailability,
    requiredStages,
    missingStages,
    reportValidationPassed: workflow.report?.validation?.passed ?? false,
  };
};
