import {
  sumTerminalAirflows,
  calculateBranchAirflow,
  sizeDuctByVelocity,
  sizeBranchDuct,
  calculateMainSegmentAirflow,
  sizeMainDuct,
  buildDuctDistribution,
} from "../engineering/airside/ductDistribution.js";
import { assertClose, assertEqual } from "./assert.js";

export const runDuctDistributionTests = () => {
  const results = [];

  const run = (id, name, fn) => {
    try {
      fn();
      results.push({ id, name, passed: true });
    } catch (error) {
      results.push({ id, name, passed: false, error: error.message });
    }
  };

  run("UNIT-DIST-001", "Terminal airflow summation", () => {
    assertClose(sumTerminalAirflows([100, 150, 200]), 450, 1e-12, "terminal airflow sum");
  });

  run("UNIT-DIST-002", "Branch airflow conversion", () => {
    const result = calculateBranchAirflow({ terminalAirflowsCfm: [100, 200] });
    assertEqual(result.airflowCfm, 300, "branch CFM");
    assertClose(result.airflowM3s, 0.141584235, 1e-9, "branch m3/s");
    assertEqual(result.terminalCount, 2, "terminal count");
  });

  run("UNIT-DIST-003", "Automatic rectangular duct sizing", () => {
    const result = sizeDuctByVelocity({
      volumeFlowM3s: 0.4,
      targetVelocityMps: 4,
      shape: "rectangular",
      widthM: 0.5,
    });
    assertClose(result.areaM2, 0.1, 1e-12, "duct area");
    assertClose(result.heightM, 0.2, 1e-12, "duct height");
    assertClose(result.velocityMps, 4, 1e-12, "duct velocity");
  });

  run("UNIT-DIST-004", "Automatic round duct sizing", () => {
    const result = sizeDuctByVelocity({
      volumeFlowM3s: 0.5,
      targetVelocityMps: 5,
      shape: "round",
    });
    assertClose(result.areaM2, 0.1, 1e-12, "round duct area");
    assertClose(result.diameterM, Math.sqrt(0.4 / Math.PI), 1e-12, "round duct diameter");
  });

  run("UNIT-DIST-005", "Branch duct sizing from terminal airflows", () => {
    const result = sizeBranchDuct({
      id: "BR-01",
      terminalIds: ["T-01", "T-02"],
      airflowCfm: 300,
      targetVelocityMps: 4,
      shape: "rectangular",
      widthM: 0.4,
    });
    assertEqual(result.id, "BR-01", "branch id");
    assertEqual(result.airflowCfm, 300, "branch airflow");
    assertClose(result.velocityMps, 4, 1e-12, "branch velocity");
    assertClose(result.areaM2, result.airflowM3s / 4, 1e-12, "branch area");
  });

  run("UNIT-DIST-006", "Main airflow reduces with downstream branches", () => {
    const branches = [
      { id: "BR-01", airflowCfm: 200 },
      { id: "BR-02", airflowCfm: 150 },
      { id: "BR-03", airflowCfm: 100 },
    ];

    const result = calculateMainSegmentAirflow({
      downstreamBranchIds: ["BR-02", "BR-03"],
      branches,
    });

    assertEqual(result.airflowCfm, 250, "downstream main airflow");
    assertClose(result.airflowM3s, 0.1179868625, 1e-9, "downstream main m3/s");
  });

  run("UNIT-DIST-007", "Complete branch and main distribution schedule", () => {
    const result = buildDuctDistribution({
      branches: [
        {
          id: "BR-01",
          terminalIds: ["T-01", "T-02"],
          terminalAirflowsCfm: [100, 100],
          targetVelocityMps: 4,
          shape: "rectangular",
          widthM: 0.4,
        },
        {
          id: "BR-02",
          terminalIds: ["T-03"],
          terminalAirflowsCfm: [150],
          targetVelocityMps: 4,
          shape: "rectangular",
          widthM: 0.4,
        },
      ],
      mainSections: [
        {
          id: "MAIN-01",
          downstreamBranchIds: ["BR-01", "BR-02"],
          targetVelocityMps: 5,
          shape: "rectangular",
          widthM: 0.6,
        },
      ],
    });

    assertEqual(result.branches.length, 2, "branch count");
    assertEqual(result.branches[0].airflowCfm, 200, "branch 1 airflow");
    assertEqual(result.branches[1].airflowCfm, 150, "branch 2 airflow");
    assertEqual(result.totalSupplyAirflowCfm, 350, "total supply airflow");
    assertEqual(result.mainSections[0].airflowCfm, 350, "main airflow");
    assertClose(result.mainSections[0].velocityMps, 5, 1e-12, "main velocity");
  });

  return results;
};
