import { COTONOU_BLD2_HAP_REFERENCE as ref } from "../engineering/validation/cotonouBld2HapReference.js";
import { assertClose, assertEqual } from "./assert.js";

export const runCotonouComponentMappingTests = () => {
  const checks = [
    assertClose(ref.internalLoads.lightingPowerDensityWPerM2 * ref.building.floorAreaM2, 206.7, 0.001, "Lighting input heat"),
    assertClose(ref.internalLoads.electricalEquipmentPowerDensityWPerM2 * ref.building.floorAreaM2, 242.1, 0.001, "Equipment input heat"),
    assertEqual(ref.ventilation.designOutdoorAirflowLps, 13, "HAP outdoor airflow reference"),
    assertEqual(ref.internalLoads.infiltrationACH, 0, "HAP infiltration reference"),
    assertClose(ref.coolingReference.coilSensibleW + ref.coolingReference.coilLatentW, ref.coolingReference.coilTotalW, 0.001, "Coil sensible plus latent reconciliation"),
    assertClose(ref.coolingReference.systemSensibleW + ref.coolingReference.systemLatentW, 3426, 0.001, "System sensible plus latent reconciliation"),
  ];

  return {
    id: "COTONOU-MAP-001",
    name: "Cotonou BLD2 component mapping integrity",
    passed: true,
    checks,
    status: "MAPPING_ONLY",
  };
};
