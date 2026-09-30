# HAP Benchmark 002: Lagos Small Office

Status: READY_FOR_HAP_REFERENCE_CAPTURE

## Purpose

Create a fresh, reproducible HAP 6.2 reference case for validating the HVAC calculator. The HAP report should be saved after the run because the final component breakdown is required for comparison.

## 1. Project and Weather

- Location: Lagos, Nigeria
- Weather/design location: Lagos / Ikeja if available in the HAP weather database
- Building type: Office
- Building shape: Rectangular
- Floors: 1
- One zone per floor: Yes
- Simulation/design day: Use HAP's normal peak cooling design condition
- Do not manually alter HAP's weather design values.

## 2. Space Geometry

- Length X: 6.0 m
- Width Y: 5.0 m
- Floor area: 30.0 m²
- Floor-to-floor height: 3.3 m
- Floor-to-ceiling height: 2.9 m
- Volume: 87.0 m³
- Window area: 20% of gross wall area
- Use one window orientation only: West wall
- No external shading unless HAP requires a default value; record the actual value used.

## 3. Space Usage

- Space type: Office
- Occupancy: 6 people
- Activity: Office work / seated
- Occupancy schedule: Use a standard HAP office occupancy schedule
- Do not use an automatic occupancy density in place of the explicit 6 people.

## 4. Internal Loads

### Lighting

- Type: LED/recessed
- Lighting density: 10 W/m²
- Total installed lighting load: 300 W
- Lighting schedule: standard office schedule

### Electrical Equipment

- Equipment density: 12 W/m²
- Total installed equipment load: 360 W
- Equipment schedule: standard office/equipment schedule

## 5. Ventilation

Use ASHRAE 62.1 space ventilation inputs:

- Outdoor air per person (Rp): 2.5 L/s-person
- Outdoor air per floor area (Ra): 0.30 L/s-m²
- Occupants: 6 people
- Area: 30.0 m²
- Required outdoor airflow before effectiveness adjustment:

  Vbz = (6 × 2.5) + (30 × 0.30) = 24.0 L/s

Record the HAP-calculated outdoor airflow and ventilation effectiveness separately.

## 6. Infiltration

- Infiltration: 0 ACH
- Do not introduce an infiltration load for this benchmark.

## 7. Envelope

Use explicit custom constructions where HAP permits. If HAP requires a library construction, select the closest construction and record its complete properties in the saved report.

### Exterior wall

Target overall U-value:
- U = 0.70 W/m²-K

### Roof

Target overall U-value:
- U = 0.22 W/m²-K

### Window

- Glazing: Double clear
- U-value = 3.12 W/m²-K
- SHGC = 0.76
- Window orientation: West
- Window area = 20% of gross wall area for the West wall only

## 8. Thermostat

- Cooling indoor dry-bulb: 24.0°C
- Cooling indoor RH: 50%
- No heating benchmark is required.

## 9. System

For the first benchmark, use a simple single-zone cooling system.

- System type: DX cooling
- One zone
- No heat recovery
- No economizer
- No special humidity control
- Supply air temperature target: 14°C if HAP requires an explicit value
- Let HAP calculate the required coil capacity and airflow.

## 10. Values to Capture From HAP

Save the complete HAP report and record at minimum:

- Peak total cooling coil load (kW)
- Peak sensible cooling coil load (kW)
- Peak latent cooling load (kW)
- SHR
- Peak coil airflow (L/s)
- Peak zone airflow (L/s)
- Outdoor airflow (L/s)
- Peak date/time
- Outdoor DB/WB
- Entering coil DB/WB
- Leaving coil DB/WB
- Supply air temperature
- People load
- Lighting load
- Equipment load
- Wall load
- Roof load
- Window conduction load
- Window solar load
- Ventilation load
- Infiltration load
- Any other miscellaneous load
- Zone thermostat check/result

## 11. Validation Rule

Do not treat the HAP total as sufficient by itself.

The benchmark becomes EXECUTABLE only when the saved HAP report provides enough information to trace the total load back to its components.

No missing HAP input or component value should be guessed.

## 12. Expected Workflow

1. Enter the parameters exactly as listed.
2. Run HAP.
3. Save/export the detailed HAP report.
4. Upload the report here.
5. We will extract the independent inputs and component loads.
6. We will run the same case through the HVAC calculator.
7. We will compare component-by-component before comparing total cooling load.
8. Any discrepancy will be classified as input, method, weather, schedule, or calculation-engine difference.

This benchmark is a reference-capture case. It does not claim that the HVAC calculator should produce a particular result before the HAP report is captured.
