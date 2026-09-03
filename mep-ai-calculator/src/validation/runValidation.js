import { testCase001 } from "./testCase001.js";
import { testWallLoad } from "./wallLoad.test.js";
import { testRoofLoad } from "./roofLoad.test.js";
import { testWindowConduction, testWindowSolarGain, testWindowCombinedLoad } from "./windowLoad.test.js";
import { testPeopleLoad, testPeopleLoadWithDiversity } from "./peopleLoad.test.js";
import { testLightingPowerDensity, testLightingFixtureSchedule, testLightingUseFactor } from "./lightingLoad.test.js";
import { testEquipmentLoad, testEquipmentLatentLoad, testEquipmentUseFactor } from "./equipmentLoad.test.js";
import { testOutdoorAirflowPeopleAndArea, testOutdoorAirflowWithEffectiveness, testVentilationSensibleLoad, testVentilationLatentAndTotalLoad } from "./ventilationLoad.test.js";
import { testInfiltrationAirflowFromACH, testInfiltrationZeroACH, testInfiltrationSensibleLoad, testInfiltrationLatentAndTotalLoad } from "./infiltrationLoad.test.js";
import { testRoomLoadAssembly, testRoomLoadMissingComponents, testRoomLoadDesignMargin, testRoomLoadZero } from "./roomLoad.test.js";
import { testSupplyAirflow, testSupplyAirState, testMixedAir, testCoilLoad } from "./airside.test.js";
import { testDxSizing, testDxEquipmentSelection, testDxCapacityCheck } from "./dxSizing.test.js";
import { runDuctSizingTests } from "./ductSizing.test.js";
import { runDuctNetworkTests } from "./ductNetwork.test.js";
import { runAirTerminalTests } from "./airTerminals.test.js";
import { runDuctDistributionTests } from "./ductDistribution.test.js";
import { runEspTests } from "./esp.test.js";

const expandGroupedTests = (groupId, groupName, runGroup) => runGroup().map((result) => ({
  id: result.id,
  name: result.name,
  run: () => { if (!result.passed) throw new Error(result.error || `${result.id} failed`); return result; },
  groupId,
  groupName,
}));

export const runValidation = () => {
  const tests = [
    { id: "TC-001", name: "Lagos Small Office", run: testCase001 },
    { id: "UNIT-WALL-001", name: "Opaque Wall Load", run: testWallLoad },
    { id: "UNIT-ROOF-001", name: "Roof Load", run: testRoofLoad },
    { id: "UNIT-WINDOW-001", name: "Window Conduction Load", run: testWindowConduction },
    { id: "UNIT-WINDOW-002", name: "Window Solar Gain", run: testWindowSolarGain },
    { id: "UNIT-WINDOW-003", name: "Combined Window Load", run: testWindowCombinedLoad },
    { id: "UNIT-PEOPLE-001", name: "Occupant Sensible and Latent Load", run: testPeopleLoad },
    { id: "UNIT-PEOPLE-002", name: "Occupant Diversity Load", run: testPeopleLoadWithDiversity },
    { id: "UNIT-LIGHT-001", name: "Lighting Power Density Load", run: testLightingPowerDensity },
    { id: "UNIT-LIGHT-002", name: "Lighting Fixture Schedule Load", run: testLightingFixtureSchedule },
    { id: "UNIT-LIGHT-003", name: "Lighting Use Factor Load", run: testLightingUseFactor },
    { id: "UNIT-EQUIP-001", name: "Equipment Sensible Load", run: testEquipmentLoad },
    { id: "UNIT-EQUIP-002", name: "Equipment Sensible and Latent Load", run: testEquipmentLatentLoad },
    { id: "UNIT-EQUIP-003", name: "Equipment Use Factor Load", run: testEquipmentUseFactor },
    { id: "UNIT-VENT-001", name: "Outdoor Airflow People and Area", run: testOutdoorAirflowPeopleAndArea },
    { id: "UNIT-VENT-002", name: "Outdoor Airflow Effectiveness", run: testOutdoorAirflowWithEffectiveness },
    { id: "UNIT-VENT-003", name: "Ventilation Sensible Load", run: testVentilationSensibleLoad },
    { id: "UNIT-VENT-004", name: "Ventilation Latent and Total Load", run: testVentilationLatentAndTotalLoad },
    { id: "UNIT-INF-001", name: "Infiltration Airflow from ACH", run: testInfiltrationAirflowFromACH },
    { id: "UNIT-INF-002", name: "Zero ACH Infiltration", run: testInfiltrationZeroACH },
    { id: "UNIT-INF-003", name: "Infiltration Sensible Load", run: testInfiltrationSensibleLoad },
    { id: "UNIT-INF-004", name: "Infiltration Latent and Total Load", run: testInfiltrationLatentAndTotalLoad },
    { id: "UNIT-ROOM-001", name: "Room Load Assembly", run: testRoomLoadAssembly },
    { id: "UNIT-ROOM-002", name: "Room Load Missing Components", run: testRoomLoadMissingComponents },
    { id: "UNIT-ROOM-003", name: "Room Load Design Margin", run: testRoomLoadDesignMargin },
    { id: "UNIT-ROOM-004", name: "Zero Room Load", run: testRoomLoadZero },
    { id: "UNIT-AIR-001", name: "Supply Airflow", run: testSupplyAirflow },
    { id: "UNIT-AIR-002", name: "Supply Air State", run: testSupplyAirState },
    { id: "UNIT-AIR-003", name: "Mixed Air State", run: testMixedAir },
    { id: "UNIT-AIR-004", name: "Cooling Coil Load", run: testCoilLoad },
    { id: "UNIT-DX-001", name: "DX Capacity Sizing", run: testDxSizing },
    { id: "UNIT-DX-002", name: "DX Equipment Selection", run: testDxEquipmentSelection },
    { id: "UNIT-DX-003", name: "DX Capacity Check", run: testDxCapacityCheck },
    ...expandGroupedTests("DUCT", "Duct Sizing and Pressure Loss", runDuctSizingTests),
    ...expandGroupedTests("NET", "Duct Network and Critical Path", runDuctNetworkTests),
    ...expandGroupedTests("TERM", "Air Terminal Selection", runAirTerminalTests),
    ...expandGroupedTests("DIST", "Automatic Duct Distribution Sizing", runDuctDistributionTests),
    ...expandGroupedTests("ESP", "Fan External Static Pressure", runEspTests),
  ];

  const results = tests.map(({ id, name, run, groupId, groupName }) => {
    try {
      const result = run();
      return { id, name, status: "PASS", result, groupId, groupName };
    } catch (error) {
      return { id, name, status: "FAIL", error: error instanceof Error ? error.message : String(error), groupId, groupName };
    }
  });

  return {
    passed: results.every((result) => result.status === "PASS"),
    total: results.length,
    passedCount: results.filter((result) => result.status === "PASS").length,
    failedCount: results.filter((result) => result.status === "FAIL").length,
    results,
  };
};

const validationResult = runValidation();
console.log("HVAC Engineering Validation");
console.log("===========================");
console.log(`Status: ${validationResult.passed ? "PASS" : "FAIL"}`);
console.log(`Tests: ${validationResult.passedCount}/${validationResult.total} passed`);
for (const result of validationResult.results) {
  console.log(`${result.id} | ${result.name} | ${result.status}`);
  if (result.error) console.error(`  ${result.error}`);
}
if (!validationResult.passed) process.exitCode = 1;
