export const createDesignConditions = () => ({
  location: {
    name: "Lagos Ikeja",
    country: "Nigeria",
    station: "652010",
    latitude: 6.58,
    longitude: 3.32,
    elevation: 41,
  },
  outdoor: {
    dryBulb: 34.8,
    meanCoincidentWetBulb: 25.9,
  },
  indoor: {
    dryBulb: 24,
    relativeHumidity: 50,
  },
  coolingDesignPercent: 0.4,
  calculationMethod: "CLTD_CLF",
});
