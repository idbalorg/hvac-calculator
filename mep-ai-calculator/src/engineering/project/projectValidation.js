const assertFinite = (value, name) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
};

const assertPositive = (value, name) => {
  assertFinite(value, name);
  if (value <= 0) throw new Error(`${name} must be greater than zero`);
};

const assertNonNegative = (value, name) => {
  assertFinite(value, name);
  if (value < 0) throw new Error(`${name} cannot be negative`);
};

export const validateProjectInput = ({
  length,
  width,
  height,
  people = 0,
  equipmentLoadKw = 0,
  windowAreaM2 = 0,
}) => {
  assertPositive(length, "length");
  assertPositive(width, "width");
  assertPositive(height, "height");
  if (!Number.isInteger(people) || people < 0) throw new Error("people must be a non-negative integer");
  assertNonNegative(equipmentLoadKw, "equipmentLoadKw");
  assertNonNegative(windowAreaM2, "windowAreaM2");
  return true;
};

export const calculateRoomGeometry = ({ length, width, height }) => {
  validateProjectInput({ length, width, height });
  return {
    floorAreaM2: length * width,
    volumeM3: length * width * height,
    wallAreaM2: 2 * height * (length + width),
  };
};
