import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing">
      <h1>HVAC Cooling Load Estimation Tool</h1>

      <p>
        A lightweight engineering tool for early HVAC system design and load
        estimation.
      </p>

      <ul>
        <li>CLTD-based heat load estimation</li>
        <li>Metric and Imperial support</li>
        <li>Climate-aware adjustments</li>
        <li>Instant AC sizing recommendation</li>
      </ul>

      <Link to="/calculator" className="cta">
        Launch Calculator
      </Link>
    </div>
  );
}
