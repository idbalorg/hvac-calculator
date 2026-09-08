import { getEngineeringInputGuidance, getEngineeringInputGuidanceKeys } from "../components/engineeringInputGuidance.js";

export default function runEngineeringInputGuidanceTests() {
  const results = [];
  const check = (name, condition, details = "") => {
    results.push({ name, passed: Boolean(condition), details });
  };

  const duct = getEngineeringInputGuidance("Duct velocity");
  check("Input guidance returns duct velocity guidance", duct !== null);
  check("Duct velocity identifies ASHRAE Fundamentals Chapter 21", duct?.reference.includes("Chapter 21"));
  check("Duct velocity explains what to look for", duct?.lookFor?.length > 20);
  check("Duct velocity explains calculation impact", duct?.feeds?.includes("duct"));
  check("Duct velocity includes verification guidance", duct?.verify?.length > 20);

  const cooling = getEngineeringInputGuidance("Cooling design percentile");
  check("Cooling design percentile has climatic-data reference", cooling?.reference.includes("Chapter 14"));
  check("Cooling design percentile has lookup guidance", cooling?.lookFor?.length > 20);

  const equipment = getEngineeringInputGuidance("Equipment airflow");
  check("Equipment airflow points to manufacturer data", equipment?.reference.toLowerCase().includes("manufacturer"));
  check("Equipment airflow warns against inferred airflow", equipment?.verify?.includes("nominal HP"));

  check("Unknown input falls back safely", getEngineeringInputGuidance("Unknown engineering input") === null);
  check("Guidance catalog contains core airside inputs", ["Supply airflow", "Duct velocity", "Friction rate", "Required ESP"].every((key) => getEngineeringInputGuidanceKeys().includes(key)));

  return results;
}
