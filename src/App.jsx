import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Home from "./pages/Home.jsx";
import Indicators from "./pages/Indicators.jsx";
import DataExplorer from "./pages/DataExplorer.jsx";
import Insights from "./pages/Insights.jsx";
import Research from "./pages/Research.jsx";
import AILaborMarket from "./pages/research/AILaborMarket.jsx";
import About from "./pages/About.jsx";

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/"                        element={<Home />} />
        <Route path="/indicators"              element={<Indicators />} />
        <Route path="/data"                    element={<DataExplorer />} />
        <Route path="/insights"                element={<Insights />} />
        <Route path="/research"                element={<Research />} />
        <Route path="/research/ai-labor-market" element={<AILaborMarket />} />
        <Route path="/about"                    element={<About />} />
      </Routes>
    </>
  );
}
