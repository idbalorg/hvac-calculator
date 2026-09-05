import { Link } from "react-router-dom";
import "../App.css";

export default function Navbar() {
  return <div className="nav"><div className="logo">HVAC Design Tool</div><div className="links"><Link to="/">Home</Link><Link to="/calculator">Cooling Load</Link><Link to="/airside">Psychrometrics & Airside</Link><Link to="/dx-sizing">DX Equipment</Link><Link to="/air-distribution">Duct & Air Distribution</Link><Link to="/air-balancing">Air Balancing</Link></div></div>;
}
