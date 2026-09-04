import { buildDesignReport } from "../engineering/report/designReport.js";
import { buildEngineeringAudit, runDesignWorkflow } from "../engineering/report/designWorkflow.js";

const project = { name: "Lagos Office", location: "Lagos, Nigeria" };
const rooms = [{
  roomId: "R1",
  roomName: "Office",
  areaM2: 30,
  sensibleLoadKw: 5,
  latentLoadKw: 1,
  supplyAirflowCfm: 800,
  terminalCount: 1,
}];
const equipment = [{
  equipmentId: "AC-01",
  systemId: "SYS-01",
  type: "ceiling-cassette",
  capacityKw: 6.0,
  requiredCapacityKw: 5.5,
  designAirflowCfm: 800,
  selectedAirflowCfm: 820,
  requiredEspPa: 100,
  selectedEspPa: 150,
}];
const ducts = [{
  ductId: "D1",
  airflowCfm: 800,
  velocityMps: 5,
  pressureLossPa: 30,
}];
const criteria = {
  minimumCapacityMarginPercent: 0,
  maximumCapacityOversizePercent: 20,
  minimumAirflowRatio: 1,
  minimumEspRatio: 1,
};

const makeInputs = () => ({
  project,
  rooms,
  roomLoadResults: [{ roomId: "R1", totalLoadKw: 6 }],
  airsideResults: [{ roomId: "R1", supplyAirflowCfm: 800 }],
  systemRequirements: { designCapacityKw: 6.5, supplyAirflowCfm: 800 },
  equipmentSelections: equipment,
  ductResults: ducts,
  systemSummary: { status: "PASS" },
  criteria,
  generatedAt: "2026-09-04T19:00:00.000Z",
  reportBuilder: buildDesignReport,
});

export const runDesignWorkflowTests = () => {
  const tests = [
    {
      id: "WF-001",
      name: "Complete workflow returns PASS",
      run: () => {
        const result = runDesignWorkflow(makeInputs());
        if (result.status !== "PASS") throw new Error("Expected workflow PASS");
        if (!result.report) throw new Error("Expected design report");
      },
    },
    {
      id: "WF-002",
      name: "Workflow preserves engineering requirements",
      run: () => {
        const result = runDesignWorkflow(makeInputs());
        if (result.requirements.designCapacityKw !== 6.5) throw new Error("Requirements were not preserved");
      },
    },
    {
      id: "WF-003",
      name: "Workflow exposes input stage counts",
      run: () => {
        const result = runDesignWorkflow(makeInputs());
        if (result.inputs.roomCount !== 1 || result.inputs.equipmentCount !== 1 || result.inputs.ductCount !== 1) {
          throw new Error("Stage counts are incorrect");
        }
      },
    },
    {
      id: "WF-004",
      name: "Workflow rejects missing room-load stage",
      run: () => {
        const input = makeInputs();
        input.roomLoadResults = [];
        try { runDesignWorkflow(input); } catch (error) { if (error.message.includes("roomLoadResults")) return; throw error; }
        throw new Error("Expected missing room-load stage to be rejected");
      },
    },
    {
      id: "WF-005",
      name: "Workflow propagates report FAIL status",
      run: () => {
        const input = makeInputs();
        input.equipmentSelections = [{ ...equipment[0], capacityKw: 4.0 }];
        const result = runDesignWorkflow(input);
        if (result.status !== "FAIL") throw new Error("Expected workflow FAIL");
      },
    },
    {
      id: "WF-006",
      name: "Engineering audit passes complete workflow",
      run: () => {
        const workflow = runDesignWorkflow(makeInputs());
        const audit = buildEngineeringAudit({ workflow });
        if (audit.status !== "PASS") throw new Error("Expected audit PASS");
        if (audit.missingStages.length !== 0) throw new Error("Expected no missing stages");
      },
    },
    {
      id: "WF-007",
      name: "Engineering audit identifies missing stage",
      run: () => {
        const workflow = runDesignWorkflow(makeInputs());
        workflow.inputs.airsideCount = 0;
        const audit = buildEngineeringAudit({ workflow });
        if (audit.status !== "FAIL") throw new Error("Expected audit FAIL");
        if (!audit.missingStages.includes("airside")) throw new Error("Expected airside stage to be missing");
      },
    },
    {
      id: "WF-008",
      name: "Workflow uses deterministic generated timestamp",
      run: () => {
        const result = runDesignWorkflow(makeInputs());
        if (result.report.generatedAt !== "2026-09-04T19:00:00.000Z") throw new Error("Timestamp was not preserved");
      },
    },
  ];

  return tests.map((test) => {
    try {
      test.run();
      return { ...test, passed: true, error: null };
    } catch (error) {
      return { ...test, passed: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
};
