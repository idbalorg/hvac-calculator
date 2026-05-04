# HVAC Cooling Load Calculator

A lightweight HVAC estimation tool built with React.

It provides quick cooling load calculations using a simplified CLTD method with real-world engineering approximations.

---

## 🚀 Features

### Version 1

- CLTD-based cooling load estimation
- Wall, roof, people, and equipment heat gains
- Room type load factors (residential, office, shop)
- Output in kW, TR (tons), and HP

### Version 2 Upgrade

- Metric and Imperial unit system support
- City-based climate adjustment (Lagos, Abuja, London, New York)
- Solar orientation factor for window heat gain
- Window heat gain calculation included
- AC sizing recommendation engine
- PDF report export
- Improved engineering-style load breakdown

---

## 🧮 Calculation Model

The tool estimates total cooling load using:

- Envelope heat gain (walls + roof)
- Internal loads (people + equipment)
- Solar gain through windows
- Climate adjustment factor
- CLTD-based approximation method

> Note: This is a simplified pre-design tool, not a full HVAC design software.

---

## 📦 Tech Stack

- React (Vite or CRA)
- JavaScript
- jsPDF (for report export)

---

## 📊 Output Includes

- Total Cooling Load (kW)
- Tonnage (TR)
- BTU/hr equivalent
- Recommended AC size
- Breakdown of heat sources

---

## 🌍 Use Cases

- Early HVAC system sizing
- Architectural design feasibility checks
- Engineering concept validation
- Educational HVAC learning tool

---

## ⚠️ Limitations

This tool does NOT include:

- Latent heat / humidity calculations
- Infiltration and air leakage modeling
- Hourly solar radiation modeling
- ASHRAE full compliance design

---

## 📈 Future Improvements

- Psychrometric chart integration
- Full ASHRAE heat load model
- VRF system design module
- Backend + project saving system
- Multi-zone HVAC design

---

## 👨‍💻 Author

Built as a learning and engineering tool for HVAC pre-design estimation.

---
