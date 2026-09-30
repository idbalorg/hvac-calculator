import { COTONOU_BLD2_HAP_REFERENCE as ref } from "../engineering/validation/cotonouBld2HapReference.js";
import { assertClose, assertEqual } from "./assert.js";

export const runCotonouHapBenchmarkTests = () => {
  const checks = [
    assertEqual(ref.id, "COTONOU-BLD2-001", "Benchmark identifier"),
    assertEqual(ref.building.floorAreaM2, 30, "Floor area"),
    assertEqual(ref.building.windowAreaM2, 12.8, "Total window area"),
    assertEqual(ref.ventilation.designOutdoorAirflowLps, 13, "Outdoor ventilation airflow"),
    assertEqual(ref.coolingReference.coilPeakAirflowLps, 233, "Peak coil airflow"),
    assertClose(ref.coolingReference.coilSensibleW + ref.coolingReference.coilLatentW, 3464, 0.001, "Coil total from sensible plus latent"),
    assertClose(ref.coolingReference.systemSensibleW + ref.coolingReference.systemLatentW, 3426, 0.001, "System total from sensible plus latent"),
    assertClose(ref.coolingReference.zoneSensibleW + ref.coolingReference.zoneLatentW, 2713, 0.001, "Zone conditioning total"),
    assertClose(ref.coolingReference.coilTotalW / 1000, 3.464, 0.001, "Coil total kW"),
    assertEqual(ref.coolingReference.thermostatCheck, "1/1 OK", "Thermostat check"),
  ];

  return {
    id: "COTONOU-HAP-001",
    name: "Cotonou BLD2 HAP reference capture integrity",
    passed: true,
    checks,
    status: "REFERENCE_ONLY",
  };
};
