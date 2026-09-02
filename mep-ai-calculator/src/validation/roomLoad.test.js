import {
  assembleRoomCoolingLoad,
  applyDesignMargin,
} from "../engineering/cooling-load/roomLoad.js";
import { assertClose } from "./assert.js";

export const testRoomLoadAssembly = () => {
  const result = assembleRoomCoolingLoad({
    walls: { sensibleW: 1000 },
    roof: { sensibleW: 500 },
    windows: { sensibleW: 800, latentW: 0 },
    people: { sensibleW: 450, latentW: 330 },
    lighting: { sensibleW: 600 },
    equipment: { sensibleW: 900 },
    ventilation: { sensibleW: 1200, latentW: 2500 },
    infiltration: { sensibleW: 300, latentW: 500 },
  });

  assertClose(result.sensibleW, 5750, 1e-9, "Room sensible load");
  assertClose(result.latentW, 3830, 1e-9, "Room latent load");
  assertClose(result.totalW, 9580, 1e-9, "Room total load");
  return assertClose(
    result.sensibleHeatRatio,
    5750 / 9580,
    1e-12,
    "Room sensible heat ratio",
  );
};

export const testRoomLoadMissingComponents = () => {
  const result = assembleRoomCoolingLoad({
    people: { sensibleW: 450, latentW: 330 },
  });

  assertClose(result.sensibleW, 450, 1e-9, "Partial room sensible load");
  assertClose(result.latentW, 330, 1e-9, "Partial room latent load");
  return assertClose(result.totalW, 780, 1e-9, "Partial room total load");
};

export const testRoomLoadDesignMargin = () => {
  const roomLoad = assembleRoomCoolingLoad({
    walls: { sensibleW: 1000 },
    people: { sensibleW: 500, latentW: 300 },
  });

  const result = applyDesignMargin(roomLoad, 10);

  assertClose(result.sensibleW, 1650, 1e-9, "Margin-adjusted sensible load");
  assertClose(result.latentW, 330, 1e-9, "Margin-adjusted latent load");
  return assertClose(result.totalW, 1980, 1e-9, "Margin-adjusted total load");
};

export const testRoomLoadZero = () => {
  const result = assembleRoomCoolingLoad();

  assertClose(result.sensibleW, 0, 1e-9, "Zero sensible load");
  assertClose(result.latentW, 0, 1e-9, "Zero latent load");
  assertClose(result.totalW, 0, 1e-9, "Zero total load");
  return assertClose(
    result.sensibleHeatRatio,
    0,
    1e-9,
    "Zero sensible heat ratio",
  );
};
