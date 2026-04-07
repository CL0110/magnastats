import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Home from "./pages/Home.jsx";
import MacroMetrics from "./pages/MacroMetrics.jsx";
import DataExplorer from "./pages/DataExplorer.jsx";
import Research from "./pages/Research.jsx";
import AILaborMarket from "./pages/research/AILaborMarket.jsx";
import Contact from "./pages/Contact.jsx";

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/"                        element={<Home />} />
        <Route path="/indicators"              element={<MacroMetrics />} />
        <Route path="/data"                    element={<DataExplorer />} />
        <Route path="/research"                element={<Research />} />
        <Route path="/research/ai-labor-market" element={<AILaborMarket />} />
        <Route path="/contact"                  element={<Contact />} />
      </Routes>
    </>
  );
}
