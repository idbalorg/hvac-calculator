import { calculateEquipmentLoad } from "../engineering/cooling-load/equipment.js";
import { assertClose } from "./assert.js";

export const testEquipmentLoad = () => {
  const result = calculateEquipmentLoad({
    equipment: [
      { type: "computer", quantity: 6, watts: 150 },
      { type: "printer", quantity: 1, watts: 300 },
    ],
  });

  return assertClose(result.total, 1200, 1e-9, "Equipment sensible load");
};

export const testEquipmentLatentLoad = () => {
  const result = calculateEquipmentLoad({
    equipment: [
      {
        type: "process equipment",
        quantity: 2,
        sensibleWatts: 400,
        latentWatts: 100,
      },
    ],
  });

  assertClose(
    result.sensible,
    800,
    1e-9,
    "Equipment sensible load with latent",
  );
  assertClose(result.latent, 200, 1e-9, "Equipment latent load");
  return assertClose(
    result.total,
    1000,
    1e-9,
    "Equipment total load with latent",
  );
};

export const testEquipmentUseFactor = () => {
  const result = calculateEquipmentLoad({
    equipment: [{ type: "computer", quantity: 6, watts: 150, useFactor: 0.8 }],
  });

  return assertClose(result.sensible, 720, 1e-9, "Equipment use-factor load");
};
