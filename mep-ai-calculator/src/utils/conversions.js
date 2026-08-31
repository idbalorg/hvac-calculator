const BTU_PER_HOUR_PER_KW = 3412.141633;
const CFM_PER_LPS = 2.11887997;
const LPS_PER_CFM = 0.47194745;
const CUBIC_FEET_PER_CUBIC_METER = 35.3146667;

export const kWToBTUh = (kw) => kw * BTU_PER_HOUR_PER_KW;
export const BTUhToKW = (btuh) => btuh / BTU_PER_HOUR_PER_KW;

export const lpsToCfm = (lps) => lps * CFM_PER_LPS;
export const cfmToLps = (cfm) => cfm * LPS_PER_CFM;

export const cubicMetersToCubicFeet = (m3) => m3 * CUBIC_FEET_PER_CUBIC_METER;
export const cubicFeetToCubicMeters = (ft3) => ft3 / CUBIC_FEET_PER_CUBIC_METER;

export const celsiusToFahrenheit = (c) => (c * 9) / 5 + 32;
export const fahrenheitToCelsius = (f) => ((f - 32) * 5) / 9;

export const wattsToKW = (watts) => watts / 1000;
export const kwToWatts = (kw) => kw * 1000;
