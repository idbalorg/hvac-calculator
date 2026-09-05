/**
 * Room cooling-load engine.
 *
 * Converts a validated room definition plus explicit engineering inputs into
 * one traceable room cooling-load result. No ASHRAE table values, material
 * properties, occupancy rates or solar factors are hidden in this engine.
 * Those values must be supplied by the project/reference dataset.
 */

import { calculateEquipmentLoad } from "./equipment.js";
import { calculateInfiltrationLoad } from "./infiltration.js";
import { calculateLightingLoadByPowerDensity } from "./lighting.js";
import { calculatePeopleLoad } from "./people.js";
import { calculateRoofLoad } from "./roof.js";
import { assembleRoomCoolingLoad, applyDesignMargin } from "./roomLoad.js";
import { calculateVentilation } from "./ventilation.js";
import { calculateWallLoad } from "./walls.js";
import { calculateWindowLoad } from "./windows.js";

const has = (value) => value !== undefined && value !== null;

const componentOrZero = (result) => result ?? { sensible: 0, latent: 0, total: 0 };

export const calculateRoomCoolingLoad = ({
  room,
  engineering = {},
  designMarginPercent = 0,
}) => {
  if (!room || typeof room !== "object") throw new Error("room is required");

  const geometry = {
    floorAreaM2: room.length * room.width,
    volumeM3: room.length * room.width * room.height,
    wallAreaM2: 2 * room.height * (room.length + room.width),
  };

  const walls = engineering.walls
    ? calculateWallLoad({ area: engineering.walls.area ?? geometry.wallAreaM2, ...engineering.walls })
    : null;

  const roof = engineering.roof
    ? calculateRoofLoad({ area: engineering.roof.area ?? geometry.floorAreaM2, ...engineering.roof })
    : null;

  const windows = engineering.windows
    ? calculateWindowLoad({ area: engineering.windows.area ?? room.windowAreaM2 ?? 0, ...engineering.windows })
    : null;

  const people = engineering.people
    ? calculatePeopleLoad({ people: room.people, ...engineering.people })
    : null;

  const lighting = engineering.lighting
    ? calculateLightingLoadByPowerDensity({ floorArea: geometry.floorAreaM2, ...engineering.lighting })
    : null;

  const equipment = engineering.equipment
    ? calculateEquipmentLoad({ equipment: engineering.equipment.items ?? engineering.equipment, defaultUseFactor: engineering.equipment.defaultUseFactor ?? 1 })
    : null;

  const ventilation = engineering.ventilation
    ? calculateVentilation({ people: room.people, areaM2: geometry.floorAreaM2, ...engineering.ventilation }).load
    : null;

  const infiltration = engineering.infiltration
    ? calculateInfiltrationLoad({ volumeM3: geometry.volumeM3, ...engineering.infiltration })
    : null;

  const load = assembleRoomCoolingLoad({
    walls: walls && { sensibleW: walls.sensible, latentW: walls.latent, totalW: walls.total },
    roof: roof && { sensibleW: roof.sensible, latentW: roof.latent, totalW: roof.total },
    windows: windows && { sensibleW: windows.sensible, latentW: windows.latent, totalW: windows.total },
    people: people && { sensibleW: people.sensible, latentW: people.latent, totalW: people.total },
    lighting: lighting && { sensibleW: lighting.sensible, latentW: lighting.latent, totalW: lighting.total },
    equipment: equipment && { sensibleW: equipment.sensible, latentW: equipment.latent, totalW: equipment.total },
    ventilation: ventilation && { sensibleW: ventilation.sensibleW, latentW: ventilation.latentW, totalW: ventilation.totalW },
    infiltration: infiltration && { sensibleW: infiltration.sensibleW, latentW: infiltration.latentW, totalW: infiltration.totalW },
  });

  const designLoad = applyDesignMargin(load, designMarginPercent);

  return {
    roomId: room.id,
    roomName: room.name,
    geometry,
    rawLoad: load,
    designLoad,
    designMarginPercent,
    components: {
      walls: componentOrZero(walls),
      roof: componentOrZero(roof),
      windows: componentOrZero(windows),
      people: componentOrZero(people),
      lighting: componentOrZero(lighting),
      equipment: componentOrZero(equipment),
      ventilation: componentOrZero(ventilation),
      infiltration: componentOrZero(infiltration),
    },
    method: "component-by-component-room-load-assembly",
    inputsProvided: {
      walls: has(engineering.walls),
      roof: has(engineering.roof),
      windows: has(engineering.windows),
      people: has(engineering.people),
      lighting: has(engineering.lighting),
      equipment: has(engineering.equipment),
      ventilation: has(engineering.ventilation),
      infiltration: has(engineering.infiltration),
    },
  };
};

export const calculateProjectCoolingLoads = ({ rooms, engineeringByRoom = {}, designMarginPercent = 0 }) => {
  if (!Array.isArray(rooms) || rooms.length === 0) throw new Error("rooms must contain at least one room");

  const roomResults = rooms.map((room) => calculateRoomCoolingLoad({
    room,
    engineering: engineeringByRoom[room.id] ?? {},
    designMarginPercent,
  }));

  const totalRawLoadW = roomResults.reduce((sum, result) => sum + result.rawLoad.totalW, 0);
  const totalDesignLoadW = roomResults.reduce((sum, result) => sum + result.designLoad.totalW, 0);

  return {
    roomResults,
    roomCount: roomResults.length,
    totalRawLoadW,
    totalDesignLoadW,
    totalRawLoadKw: totalRawLoadW / 1000,
    totalDesignLoadKw: totalDesignLoadW / 1000,
  };
};
