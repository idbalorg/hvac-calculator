import { Link } from "react-router-dom";
import "../App.css";

export default function Navbar() {
  return (
    <div className="nav">
      <div className="logo">HVAC Design Tool</div>

      <div className="links">
        <Link to="/">Home</Link>
        <Link to="/calculator">Calculator</Link>
      </div>
    </div>
  );
}
