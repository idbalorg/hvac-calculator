import { createRoom } from "../models/room.js";
import { createDesignConditions } from "../models/designConditions.js";
import {
  humidityRatioFromRelativeHumidity,
  humidityRatioFromWetBulb,
  relativeHumidityFromHumidityRatio,
} from "../engineering/psychrometrics/humidityRatio.js";
import { moistAirEnthalpy } from "../engineering/psychrometrics/enthalpy.js";
import { assertClose, assertEqual } from "./assert.js";

/**
 * Test Case 001: Lagos Small Office
 *
 * This is the baseline engineering test case for the new calculation engine.
 * Cooling-load totals are intentionally not asserted yet because the final
 * CLTD/CLF factor dataset has not been locked.
 */
export const testCase001 = () => {
  const room = createRoom();
  room.name = "Test Office 001";
  room.roomType = "office";
  room.dimensions = { length: 6, width: 5, height: 3 };
  room.occupancy = { people: 6, activity: "office" };
  room.equipment = [
    {
      type: "computer",
      quantity: 6,
      watts: 150,
    },
  ];
  room.surfaces.windows = [
    {
      width: 3,
      height: 2,
      orientation: "west",
    },
  ];

  const designConditions = createDesignConditions();

  const volume =
    room.dimensions.length * room.dimensions.width * room.dimensions.height;
  const floorArea = room.dimensions.length * room.dimensions.width;

  const indoorW = humidityRatioFromRelativeHumidity(
    designConditions.indoor.dryBulb,
    designConditions.indoor.relativeHumidity,
  );

  const outdoorW = humidityRatioFromWetBulb(
    designConditions.outdoor.dryBulb,
    designConditions.outdoor.meanCoincidentWetBulb,
  );

  const indoorRHCheck = relativeHumidityFromHumidityRatio(
    designConditions.indoor.dryBulb,
    indoorW,
  );

  const indoorEnthalpy = moistAirEnthalpy(
    designConditions.indoor.dryBulb,
    indoorW,
  );

  const outdoorEnthalpy = moistAirEnthalpy(
    designConditions.outdoor.dryBulb,
    outdoorW,
  );

  const results = [
    assertClose(floorArea, 30, 1e-9, "Floor area"),
    assertClose(volume, 90, 1e-9, "Room volume"),
    assertEqual(room.occupancy.people, 6, "Occupancy"),
    assertEqual(room.equipment[0].quantity, 6, "Computer quantity"),
    assertClose(
      room.surfaces.windows[0].width * room.surfaces.windows[0].height,
      6,
      1e-9,
      "Window area",
    ),
    assertClose(indoorRHCheck, 50, 0.05, "Indoor RH round-trip"),
  ];

  if (!(outdoorW > indoorW)) {
    throw new Error(
      `Outdoor humidity ratio check failed: expected outdoor W (${outdoorW}) to exceed indoor W (${indoorW}).`,
    );
  }

  if (!(outdoorEnthalpy > indoorEnthalpy)) {
    throw new Error(
      `Outdoor enthalpy check failed: expected outdoor h (${outdoorEnthalpy}) to exceed indoor h (${indoorEnthalpy}).`,
    );
  }

  return {
    id: "TC-001",
    name: "Lagos Small Office",
    status: "PASS",
    inputs: {
      room,
      designConditions,
    },
    psychrometrics: {
      indoorHumidityRatio: indoorW,
      outdoorHumidityRatio: outdoorW,
      indoorEnthalpy,
      outdoorEnthalpy,
    },
    results,
    note: "Cooling-load validation will be added after the CLTD/CLF factor dataset is locked.",
  };
};
