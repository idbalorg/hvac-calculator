export const createProject = () => ({
  id: crypto.randomUUID(),
  name: "",
  location: "Lagos Ikeja",
  units: "SI",
  calculationMethod: "CLTD_CLF",
  designConditions: null,
  rooms: [],
  hvacSystem: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
