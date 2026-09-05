import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Calculator from "./pages/Calculator";
import AirsideDesign from "./pages/AirsideDesign";
import DxSystemSizing from "./pages/DxSystemSizing";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/airside" element={<AirsideDesign />} />
        <Route path="/dx-sizing" element={<DxSystemSizing />} />
      </Routes>
    </BrowserRouter>
  );
}
