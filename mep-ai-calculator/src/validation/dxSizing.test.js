import { assertClose, assertEqual } from "./assert.js";
import {
  sizeDxSystem,
  selectDxEquipment,
  calculateDxCapacityCheck,
} from "../engineering/systems/dxSizing.js";

export const testDxSizing = () => {
  const result = sizeDxSystem({
    roomLoadW: 10000,
    designMarginPercent: 10,
  });

  assertClose(result.designLoadW, 11000, 0.0001, "DX design load");
  assertClose(result.requiredCapacityKW, 11, 0.0001, "Required DX capacity kW");
  assertClose(result.requiredCapacityTR, 11 / 3.517, 0.0001, "Required DX capacity TR");
};

export const testDxEquipmentSelection = () => {
  const result = selectDxEquipment({
    requiredCapacityKW: 10,
    maxOversizeFraction: 0.2,
    equipment: [
      { model: "A", coolingCapacityKW: 9 },
      { model: "B", coolingCapacityKW: 10.5 },
      { model: "C", coolingCapacityKW: 12 },
      { model: "D", coolingCapacityKW: 14 },
    ],
  });

  assertEqual(result.selected.model, "B", "Best acceptable DX unit");
  assertClose(result.selected.capacityRatio, 1.05, 0.0001, "Selected capacity ratio");
};

export const testDxCapacityCheck = () => {
  const result = calculateDxCapacityCheck({
    requiredCapacityKW: 10,
    selectedCapacityKW: 11,
  });

  assertClose(result.coveragePercent, 110, 0.0001, "DX coverage percent");
  assertClose(result.excessCapacityKW, 1, 0.0001, "DX excess capacity");
  assertEqual(result.meetsLoad, true, "Selected unit meets load");
};
