const GUIDANCE = {
  "Cooling design percentile": {
    reference: "ASHRAE Handbook—Fundamentals, Chapter 14, Climatic Design Information.",
    lookFor: "The adopted cooling design frequency and the corresponding coincident outdoor dry-bulb and humidity data for the project location.",
    feeds: "Sets the outdoor design state used by cooling-load and psychrometric calculations.",
    verify: "Confirm the project-adopted percentile, location/weather station and coincident humidity basis."
  },
  "Outdoor design condition": {
    reference: "ASHRAE Handbook—Fundamentals, Chapter 14, Climatic Design Information.",
    lookFor: "Design dry-bulb plus the coincident humidity/wet-bulb condition for the selected location.",
    feeds: "Defines the outdoor state for envelope, ventilation, mixed-air and coil-load calculations.",
    verify: "Check the weather station, elevation/location and adopted project design condition."
  },
  "Occupants": {
    reference: "Project room schedule; ASHRAE Standard 62.1 where ventilation applies; ASHRAE Handbook—Fundamentals for load calculations.",
    lookFor: "Design occupancy, not simply current headcount. Use the room/space classification and approved project schedule.",
    feeds: "People sensible/latent gains and, where applicable, outdoor-air ventilation requirements.",
    verify: "Confirm occupancy against the architectural brief and approved ventilation design."
  },
  "Window area": {
    reference: "Architectural window schedule/elevations; ASHRAE Handbook—Fundamentals, Chapter 15, Fenestration.",
    lookFor: "Net exposed glazing area by orientation, including the actual window/door arrangement.",
    feeds: "Window conductive and solar heat-gain calculations.",
    verify: "Confirm dimensions, orientation, shading and whether the selected area is net conditioned-space exposure."
  },
  "Window U-value": {
    reference: "ASHRAE Handbook—Fundamentals, Chapter 15; approved window schedule and manufacturer data.",
    lookFor: "Overall window assembly U-factor, preferably for the actual specified glazing/frame system.",
    feeds: "Conductive fenestration heat gain.",
    verify: "Use the approved assembly value and confirm units and rating basis."
  },
  "Indoor dry-bulb": {
    reference: "Project design brief; ASHRAE Standard 55 and ASHRAE Handbook—Fundamentals, Chapter 9 where applicable.",
    lookFor: "The project's indoor comfort/design temperature for the space type.",
    feeds: "Room load assumptions and psychrometric state calculations.",
    verify: "Confirm the adopted comfort criterion and whether the space has a special temperature requirement."
  },
  "Indoor RH": {
    reference: "Project humidity criterion; applicable ASHRAE comfort/IAQ guidance and project requirements.",
    lookFor: "The required indoor relative-humidity target or acceptable operating range.",
    feeds: "Indoor psychrometric state and latent/airside calculations.",
    verify: "Confirm that the value is a project requirement or an approved design assumption."
  },
  "Outdoor airflow": {
    reference: "ASHRAE Standard 62.1 for applicable commercial spaces, plus local code and project ventilation criteria.",
    lookFor: "Applicable space/occupancy category, people component, area component and any system-level outdoor-air requirements.",
    feeds: "Ventilation airflow, mixed-air condition and associated coil load.",
    verify: "Confirm the space classification and adopted code requirement rather than using a generic airflow rate."
  },
  "Supply-air dry bulb": {
    reference: "Project psychrometric/system design basis and selected equipment capability.",
    lookFor: "The selected supply-air temperature derived from the room sensible load, comfort requirement and equipment/coil capability.",
    feeds: "Supply-airflow calculation and downstream equipment/duct sizing.",
    verify: "Check room comfort, coil capability, condensation risk and the resulting airflow."
  },
  "Coil leaving-air RH": {
    reference: "Project psychrometric design basis and selected coil/manufacturer performance data.",
    lookFor: "A defensible coil leaving/supply-air humidity state for the selected operating condition.",
    feeds: "Psychrometric process and latent/total coil performance calculations.",
    verify: "Treat it as an explicit assumption until confirmed by actual coil selection/performance data."
  },
  "Supply airflow": {
    reference: "Project room sensible load and Stage 13 psychrometric/airside calculation.",
    lookFor: "Required room supply CFM derived from sensible duty and the selected supply-air condition.",
    feeds: "Terminal/equipment selection, duct sizing and air-balancing targets.",
    verify: "Reconcile the calculated airflow with selected equipment capability and final room layout."
  },
  "Equipment airflow": {
    reference: "Certified manufacturer technical data and fan performance tables.",
    lookFor: "Rated/operating airflow at the applicable capacity, fan setting and external static pressure.",
    feeds: "Equipment selection and comparison against calculated room supply airflow.",
    verify: "Do not infer airflow from nominal HP or capacity alone. Confirm the actual model data."
  },
  "Indoor capacity": {
    reference: "Certified manufacturer technical data for the selected indoor unit and operating combination.",
    lookFor: "Cooling capacity at the relevant indoor/outdoor conditions, not just nominal model size.",
    feeds: "Equipment selection and room-capacity reconciliation.",
    verify: "Check capacity against design load and the project's permitted oversizing criterion."
  },
  "Indoor available ESP": {
    reference: "Manufacturer fan performance data for the selected indoor unit.",
    lookFor: "External static pressure capability at the required airflow and operating point.",
    feeds: "Duct-system feasibility and fan selection for ducted arrangements.",
    verify: "Compare against calculated external resistance, including terminals, filters and fittings."
  },
  "Duct velocity": {
    reference: "ASHRAE Handbook—Fundamentals, Chapter 21, Duct Design; SMACNA duct-design guidance; project acoustic criteria.",
    lookFor: "A project-appropriate velocity criterion for the duct type and space, considering noise and pressure loss.",
    feeds: "Duct cross-sectional area through A = Q/V and therefore duct dimensions.",
    verify: "Check noise, pressure loss, available ceiling space and fan static pressure. This is not a universal ASHRAE limit."
  },
  "Main duct velocity": {
    reference: "ASHRAE Handbook—Fundamentals, Chapter 21; SMACNA duct-design guidance; project acoustic criteria.",
    lookFor: "The adopted velocity criterion for main ducts carrying combined branch airflow.",
    feeds: "Main duct sizing and pressure-loss calculation.",
    verify: "Check acoustic requirements, pressure loss and available service space."
  },
  "Branch duct velocity": {
    reference: "ASHRAE Handbook—Fundamentals, Chapter 21; SMACNA duct-design guidance.",
    lookFor: "The adopted branch velocity criterion for the terminal/room application.",
    feeds: "Branch duct dimensions and pressure loss.",
    verify: "Check terminal noise, fittings, balancing and available ceiling space."
  },
  "Friction rate": {
    reference: "ASHRAE Handbook—Fundamentals, Chapter 21, Duct Design; SMACNA duct-design guidance.",
    lookFor: "The selected friction-loss method/rate and the project's pressure-loss criterion.",
    feeds: "Duct dimensions and estimated pressure loss along each section.",
    verify: "Check the critical path, fitting losses, terminal losses and fan ESP. Avoid selecting a friction rate without checking the complete system pressure budget."
  },
  "Required ESP": {
    reference: "Duct-system pressure-loss calculation, terminal/filter/grille data and manufacturer fan performance; SMACNA where applicable.",
    lookFor: "Total external resistance at the required airflow, including fittings and connected components.",
    feeds: "Ducted indoor-unit/fan selection and feasibility.",
    verify: "Confirm the fan can deliver the required airflow at the calculated ESP."
  },
  "Refrigerant": {
    reference: "Manufacturer technical data and ASHRAE Standard 15 where refrigeration safety requirements apply.",
    lookFor: "Specified refrigerant designation, safety classification, charge limits and installation requirements.",
    feeds: "Equipment compatibility, piping/installation and safety checks.",
    verify: "Use the exact manufacturer's refrigerant and verify applicable safety/code requirements."
  },
  "Pipe size": {
    reference: "Manufacturer installation/design data plus applicable ASHRAE Handbook piping guidance and project standards.",
    lookFor: "Permitted pipe sizes for the selected model, length, vertical lift and operating arrangement.",
    feeds: "Refrigerant/hydronic pressure loss, flow and installation feasibility.",
    verify: "Confirm manufacturer maximum lengths, lifts, velocities and any oil-return/charge requirements."
  },
  "Pipe length": {
    reference: "Coordinated MEP drawings/site measurement and manufacturer installation limits.",
    lookFor: "Actual or coordinated route length, including relevant vertical lift and equivalent-length considerations.",
    feeds: "Piping pressure loss, refrigerant charge and equipment installation limits.",
    verify: "Confirm final route against the coordinated/as-built installation."
  },
  "Measured airflow": {
    reference: "Approved testing and balancing procedure and calibrated field instruments.",
    lookFor: "Terminal/branch airflow measured under stable operating conditions.",
    feeds: "Air-balance verification against design airflow.",
    verify: "Record instrument, test condition and measurement location. Compare with approved design targets."
  },
  "Measured ESP": {
    reference: "Commissioning/TAB procedure, calibrated pressure instruments and manufacturer test points.",
    lookFor: "Measured fan external static pressure at the relevant operating point.",
    feeds: "Fan/system operating-point verification.",
    verify: "Compare measured ESP and airflow with manufacturer performance and design calculations."
  },
  "Maximum oversize": {
    reference: "Project equipment-selection criteria and engineer judgement; manufacturer operating requirements.",
    lookFor: "The project's explicit maximum capacity allowance above calculated design load.",
    feeds: "Equipment selection pass/fail logic.",
    verify: "Ensure the allowance is not compounded with other margins without engineering justification."
  },
  "Design margin": {
    reference: "Project design criteria and engineer judgement; ASHRAE Handbook—Fundamentals load-calculation guidance.",
    lookFor: "The explicitly adopted allowance, with its reason and where it is applied in the workflow.",
    feeds: "Design cooling load after the calculated raw load.",
    verify: "Use accurate inputs first and avoid stacking multiple undocumented safety factors."
  }
};

export function getEngineeringInputGuidance(label) {
  const key = String(label || "").replace(/\s+/g, " ").trim();
  return GUIDANCE[key] || null;
}

export function getEngineeringInputGuidanceKeys() {
  return Object.keys(GUIDANCE);
}

export default GUIDANCE;
