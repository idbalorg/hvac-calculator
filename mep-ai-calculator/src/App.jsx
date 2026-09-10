import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Calculator from "./pages/Calculator";
import AirsideDesign from "./pages/AirsideDesign";
import DxSystemSizing from "./pages/DxSystemSizing";
import AirDistribution from "./pages/AirDistribution";
import AirBalancingSystem from "./pages/AirBalancingSystem";
import SystemCommissioning from "./pages/SystemCommissioning";
import FinalDesignPackage from "./pages/FinalDesignPackage";
import DesignReleaseManagement from "./pages/DesignReleaseManagement.jsx";
import ReleaseAudit from "./pages/ReleaseAudit.jsx";
import Navbar from "./components/Navbar";
import EngineeringInputHelp from "./components/EngineeringInputHelp";
import EngineeringInputGuidance from "./components/EngineeringInputGuidance.jsx";

export default function App() {
  return <BrowserRouter><Navbar /><EngineeringInputHelp /><EngineeringInputGuidance /><Routes><Route path="/" element={<Landing />} /><Route path="/calculator" element={<Calculator />} /><Route path="/airside" element={<AirsideDesign />} /><Route path="/dx-sizing" element={<DxSystemSizing />} /><Route path="/air-distribution" element={<AirDistribution />} /><Route path="/air-balancing" element={<AirBalancingSystem />} /><Route path="/commissioning" element={<SystemCommissioning />} /><Route path="/final-package" element={<FinalDesignPackage />} /><Route path="/release-management" element={<DesignReleaseManagement />} /><Route path="/release-audit" element={<ReleaseAudit />} /></Routes></BrowserRouter>;
}
