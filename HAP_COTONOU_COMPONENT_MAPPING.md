# Cotonou BLD2 HAP vs Calculator Component Mapping

Status: MAPPING_COMPLETE_PENDING_METHOD_INPUTS

This is the first component-level reconciliation of the user-supplied Carrier HAP 6.3 Cotonou BLD2 report against the current room cooling-load engine.

## Directly comparable

- Floor area: 30.0 m²
- Outdoor ventilation airflow: 13 L/s
- Lighting input: 6.89 × 30 = 206.7 W
- Equipment input: 8.07 × 30 = 242.1 W
- Infiltration: 0 ACH
- Wall U-value: 0.704 W/m²-K
- Roof U-value: 0.221 W/m²-K
- Window U-value: 1.647 W/m²-K
- Window SHGC: 0.400

## HAP zone heat-balance reference

At the January 15:00 peak HAP reports:

- Exterior wall convection: 983 W
- Roof convection: 568 W
- Window convection: 383 W
- Floor: 377 W
- Overhead lighting: 129 W
- Electric equipment: 182 W
- People sensible: 35 W
- People latent: 97 W
- Zone sensible total: 2657 W
- Zone latent total: 97 W

## Important component mapping

### Lighting

The current engine treats lighting power as space sensible heat.

6.89 W/m² × 30 m² = 206.7 W.

HAP also reports 207 W overhead lighting, but only 129 W as direct convective sensible heat. HAP explains that radiative heat is absorbed by surfaces and subsequently appears in surface-convection terms.

Therefore 206.7 W is directly comparable as the lighting input. The 129 W convective value is not a valid direct target for the current lighting component.

### Equipment

The current engine gives:

8.07 W/m² × 30 m² = 242.1 W.

HAP reports 242 W electrical equipment, with 182 W direct convective sensible heat.

Therefore 242.1 W is directly comparable as equipment heat input. The 182 W value is not the direct target for the current equipment component because HAP redistributes radiative heat through surfaces.

### People

HAP's peak heat balance shows 2 people contributing 35 W sensible and 97 W latent.

The report also gives 18.58 m²/person, which implies about 1.61 people in 30 m² before schedule/diversity treatment.

The current people model requires explicit people count and sensible/latent heat per person. The report does not provide the underlying HAP occupant heat-rate table or diversity schedule.

Do not reverse-engineer 17.5 W sensible/person and 48.5 W latent/person as if they were HAP source inputs. Those would only be fitted values.

## Envelope loads

HAP reports surface-convection values of 983 W wall, 568 W roof and 383 W window.

The current engine uses U × A × corrected CLTD for walls and roof. Windows use U × A × corrected CLTD plus an explicit solar-gain calculation.

The HAP report does not provide the exact corrected CLTD values, solar irradiance/SCL inputs, orientation-specific factors, or complete surface heat-balance method.

These envelope component targets are therefore blocked for a like-for-like execution.

The 383 W HAP window-convection value must not be treated as equivalent to the calculator's explicit window-solar result. HAP states that solar gains are absorbed by surfaces and ultimately appear in surface-convection line items.

## Ventilation

HAP directly reports 13 L/s outdoor air, with outdoor state 31.2 °C and humidity ratio 0.02000 kg/kg. It reports 115 W sensible and 383 W latent ventilation load.

The current ventilation model calculates load from dry-bulb and relative humidity using psychrometric enthalpy. Its current convenience API does not accept humidity ratio directly.

Therefore 13 L/s is directly comparable, while the 115/383 W ventilation load needs a psychrometric input/method mapping before becoming a tolerance test.

## System boundary

HAP reports 233 L/s zone supply airflow, 2943 W sensible and 483 W latent system load, 2951 W sensible and 513 W latent coil load, 215 W supply-fan heat and 497 Pa fan static.

The current room-load engine stops at room component loads. It does not yet model mixed air, central coil, supply-fan heat, system-level ventilation mixing, duct heat gain/loss or equipment selection.

Therefore the 3.464 kW coil result is a future system-level validation target, not a room-load-engine target.

## Required inputs before executable HAP comparison

1. HAP corrected CLTD values or equivalent surface heat-transfer inputs for the January 15:00 peak.
2. Window orientation and HAP solar/SCL data used for the 383 W window/surface result.
3. HAP occupant sensible/latent heat-rate source and schedule/diversity inputs.
4. A defined mapping from HAP humidity-ratio inputs to the calculator's ventilation psychrometric API.
5. System-level calculation inputs required to reproduce 233 L/s, mixed air, fan heat and coil load.

## Engineering decision

Do not change the current cooling-load equations to fit the HAP outputs.

Use this sequence:

HAP reference capture → input/method mapping → component execution → variance report → methodology review → only then engine changes.

This preserves traceability and prevents fitting the calculator to unexplained HAP output values.
