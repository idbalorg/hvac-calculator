import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Calculator from "./pages/Calculator";
import AirsideDesign from "./pages/AirsideDesign";
import DxSystemSizing from "./pages/DxSystemSizing";
import AirDistribution from "./pages/AirDistribution";
import AirBalancingSystem from "./pages/AirBalancingSystem";
import SystemCommissioning from "./pages/SystemCommissioning";
import FinalDesignPackage from "./pages/FinalDesignPackage";
import Navbar from "./components/Navbar";
import EngineeringInputHelp from "./components/EngineeringInputHelp";

export default function App() {
  return <BrowserRouter><Navbar /><EngineeringInputHelp /><Routes><Route path="/" element={<Landing />} /><Route path="/calculator" element={<Calculator />} /><Route path="/airside" element={<AirsideDesign />} /><Route path="/dx-sizing" element={<DxSystemSizing />} /><Route path="/air-distribution" element={<AirDistribution />} /><Route path="/air-balancing" element={<AirBalancingSystem />} /><Route path="/commissioning" element={<SystemCommissioning />} /><Route path="/final-package" element={<FinalDesignPackage />} /></Routes></BrowserRouter>;
}
