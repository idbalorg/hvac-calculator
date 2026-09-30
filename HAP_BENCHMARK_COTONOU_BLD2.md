# HAP Benchmark: Cotonou BLD2

Status: REFERENCE_CAPTURED

Source: user-supplied Carrier HAP 6.3 report for Cotonou Cajehoun, Benin.

This is the actual reference case supplied for the current validation work. It replaces the earlier planned Lagos reference-capture case as the active HAP comparison target.

## Captured reference

- Building: Office, low-rise, 1 floor, one zone
- Geometry: 6.0 m × 5.0 m, 30.0 m²
- Level-to-level height: 2.9 m
- Gross wall area: 63.8 m²
- Total window area: 12.8 m²
- Ventilation basis: ASHRAE 62.1-2019
- Outdoor airflow: 13 L/s
- Infiltration: 0 ACH
- Wall U-value: 0.704 W/m²-K
- Roof U-value: 0.221 W/m²-K
- Window U-value: 1.647 W/m²-K
- Window SHGC: 0.400
- Lighting density: 6.89 W/m²
- Electrical equipment density: 8.07 W/m²

## Cooling reference

- Peak: January 15:00
- Outdoor DB/WB: 31.3/26.5 °C
- Entering coil DB/WB: 24.3/18.2 °C
- Leaving coil DB/WB: 14.0/13.9 °C
- Design supply temperature: 14.4 °C
- Coil sensible: 2.951 kW
- Coil latent: 0.513 kW
- Coil total: 3.464 kW, displayed by HAP as approximately 3.5 kW
- Peak coil airflow: 233 L/s
- SHR: 0.852
- Zone sensible conditioning: 2.613 kW
- Zone latent conditioning: 0.100 kW
- Outdoor ventilation airflow: 13 L/s
- System sensible: 2.943 kW
- System latent: 0.483 kW
- Fan total static: 497 Pa

## Important validation boundary

The report is sufficient to establish a traceable HAP reference result, but it is not sufficient to reconstruct every HAP component with the current component-load engine.

In particular, the report does not provide the exact CLTD values, solar irradiance inputs, detailed schedules/diversity assumptions, or the full method mapping needed for a like-for-like calculation.

Therefore:

1. Do not change the calculation engine to force these HAP totals.
2. Do not invent missing CLTD or solar inputs.
3. First compare captured values where the methods are directly comparable.
4. Then map the missing HAP methods/inputs.
5. Only after that should the benchmark become an executable engine-vs-HAP tolerance test.

The HAP report also notes that its surface-convection line items include conductive and radiative effects, with solar gains ultimately appearing through surface convection. This means HAP window/surface component lines should not automatically be equated to the calculator's explicit window-conduction and window-solar terms.
