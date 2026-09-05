import {
  buildIndoorDesignCondition,
  buildProjectDesignConditions,
  getDesignCondition,
  listDesignConditions,
  validateDesignCondition,
  validateDesignConditionSelection,
} from "../engineering/project/designConditions.js";

const expectThrow = (fn) => {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
};

export const runDesignConditionTests = () => {
  const tests = [
    {
      id: "COND-001",
      name: "Load Lagos ASHRAE reference condition",
      run: () => {
        const condition = getDesignCondition("LAGOS_IKEJA_ASHRAE_2021");
        if (condition.location !== "Lagos Ikeja") throw new Error("Unexpected location");
        if (condition.station !== "652010") throw new Error("Unexpected weather station");
        if (condition.cooling.db.percentile04.dryBulbC !== 34.8) throw new Error("Unexpected 0.4% DB");
        return true;
      },
    },
    {
      id: "COND-002",
      name: "Validate design condition structure",
      run: () => validateDesignCondition(getDesignCondition("LAGOS_IKEJA_ASHRAE_2021")),
    },
    {
      id: "COND-003",
      name: "Select 0.4% cooling condition",
      run: () => {
        const result = buildProjectDesignConditions({ outdoorConditionId: "LAGOS_IKEJA_ASHRAE_2021" });
        if (result.selectedCoolingCondition.dryBulbC !== 34.8) throw new Error("Wrong selected DB");
        if (result.selectedCoolingCondition.meanCoincidentWetBulbC !== 25.9) throw new Error("Wrong selected MCWB");
        return true;
      },
    },
    {
      id: "COND-004",
      name: "Select 1% cooling condition",
      run: () => {
        const result = buildProjectDesignConditions({ outdoorConditionId: "LAGOS_IKEJA_ASHRAE_2021", coolingPercentile: "percentile1" });
        if (result.selectedCoolingCondition.dryBulbC !== 34.1) throw new Error("Wrong 1% DB");
        return true;
      },
    },
    {
      id: "COND-005",
      name: "Select 2% cooling condition",
      run: () => {
        const result = buildProjectDesignConditions({ outdoorConditionId: "LAGOS_IKEJA_ASHRAE_2021", coolingPercentile: "percentile2" });
        if (result.selectedCoolingCondition.dryBulbC !== 33.7) throw new Error("Wrong 2% DB");
        return true;
      },
    },
    {
      id: "COND-006",
      name: "Build indoor design condition",
      run: () => {
        const result = buildIndoorDesignCondition({ dryBulbC: 24, relativeHumidityPercent: 50 });
        if (result.dryBulbC !== 24 || result.relativeHumidityPercent !== 50) throw new Error("Indoor condition mismatch");
        return true;
      },
    },
    {
      id: "COND-007",
      name: "Reject invalid indoor humidity",
      run: () => {
        if (!expectThrow(() => buildIndoorDesignCondition({ dryBulbC: 24, relativeHumidityPercent: 120 }))) throw new Error("Invalid RH accepted");
        return true;
      },
    },
    {
      id: "COND-008",
      name: "Reject unknown location",
      run: () => {
        if (!expectThrow(() => getDesignCondition("UNKNOWN"))) throw new Error("Unknown condition accepted");
        return true;
      },
    },
    {
      id: "COND-009",
      name: "Validate condition selection",
      run: () => validateDesignConditionSelection({ outdoorConditionId: "LAGOS_IKEJA_ASHRAE_2021", coolingPercentile: "percentile04" }),
    },
    {
      id: "COND-010",
      name: "Reject unsupported percentile",
      run: () => {
        if (!expectThrow(() => validateDesignConditionSelection({ outdoorConditionId: "LAGOS_IKEJA_ASHRAE_2021", coolingPercentile: "percentile05" }))) throw new Error("Unsupported percentile accepted");
        return true;
      },
    },
    {
      id: "COND-011",
      name: "List available design conditions",
      run: () => {
        const conditions = listDesignConditions();
        if (conditions.length < 1) throw new Error("No design conditions available");
        if (conditions[0].id !== "LAGOS_IKEJA_ASHRAE_2021") throw new Error("Unexpected first condition");
        return true;
      },
    },
    {
      id: "COND-012",
      name: "Keep source metadata traceable",
      run: () => {
        const condition = getDesignCondition("LAGOS_IKEJA_ASHRAE_2021");
        if (!condition.source || condition.sourceEdition !== 2021) throw new Error("Source metadata missing");
        return true;
      },
    },
  ];

  return tests.map((test) => {
    try {
      test.run();
      return { id: test.id, name: test.name, passed: true };
    } catch (error) {
      return { id: test.id, name: test.name, passed: false, error: error.message };
    }
  });
};
