export const createRoom = () => ({
  id: crypto.randomUUID(),
  name: "",
  roomType: "office",
  dimensions: {
    length: 0,
    width: 0,
    height: 0,
  },
  occupancy: {
    people: 0,
    activity: "office",
  },
  lighting: {
    method: "powerDensity",
    value: 0,
  },
  equipment: [],
  surfaces: {
    walls: [],
    windows: [],
    doors: [],
    roof: null,
  },
  ventilation: {
    method: "ashrae",
    airflow: 0,
  },
  infiltration: {
    method: "ach",
    value: 0,
  },
});
