const assertObject = (value, name) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
};

const assertNonEmptyString = (value, name) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
};

const assertPositive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
};

const assertNonNegative = (value, name) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} cannot be negative`);
  }
};

const normalizeRoomId = (value) => value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

export const validateRoom = (room) => {
  assertObject(room, "room");
  assertNonEmptyString(room.id, "room.id");
  assertNonEmptyString(room.name, "room.name");
  assertPositive(room.length, "room.length");
  assertPositive(room.width, "room.width");
  assertPositive(room.height, "room.height");
  if (!Number.isInteger(room.people) || room.people < 0) throw new Error("room.people must be a non-negative integer");
  assertNonNegative(room.equipmentLoadKw ?? 0, "room.equipmentLoadKw");
  assertNonNegative(room.windowAreaM2 ?? 0, "room.windowAreaM2");
  return true;
};

export const createRoom = ({ id, name, length, width, height, people = 0, equipmentLoadKw = 0, windowAreaM2 = 0, ...rest }) => {
  const room = {
    id: normalizeRoomId(id),
    name: name.trim(),
    length,
    width,
    height,
    people,
    equipmentLoadKw,
    windowAreaM2,
    ...rest,
  };
  validateRoom(room);
  return room;
};

export const validateUniqueRoomIds = (rooms) => {
  if (!Array.isArray(rooms) || rooms.length === 0) throw new Error("rooms must contain at least one room");
  const ids = rooms.map((room) => {
    validateRoom(room);
    return normalizeRoomId(room.id);
  });
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) throw new Error(`Duplicate room id: ${duplicates[0]}`);
  return true;
};

export const calculateProjectRoomSummary = (rooms) => {
  validateUniqueRoomIds(rooms);
  return rooms.reduce((summary, room) => {
    summary.roomCount += 1;
    summary.floorAreaM2 += room.length * room.width;
    summary.volumeM3 += room.length * room.width * room.height;
    summary.occupants += room.people;
    summary.equipmentLoadKw += room.equipmentLoadKw ?? 0;
    summary.windowAreaM2 += room.windowAreaM2 ?? 0;
    return summary;
  }, {
    roomCount: 0,
    floorAreaM2: 0,
    volumeM3: 0,
    occupants: 0,
    equipmentLoadKw: 0,
    windowAreaM2: 0,
  });
};

export const buildProjectRooms = (rooms) => {
  validateUniqueRoomIds(rooms);
  return rooms.map((room) => ({
    ...room,
    geometry: {
      floorAreaM2: room.length * room.width,
      volumeM3: room.length * room.width * room.height,
      wallAreaM2: 2 * room.height * (room.length + room.width),
    },
  }));
};
