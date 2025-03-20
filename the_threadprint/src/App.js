import "./App.css";
import Home from "./components/Home/Home";
import GroupBarChart from "./components/Group Bar Chart/GroupBarChart";
import PackedBubbleChart from "./components/PackedBubbleChart/PackedBubbleChart";
import TreeMap from "./components/TreeMap/TreeMap";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/bubble-chart" element={<PackedBubbleChart />} />
          <Route path="/bar-chart" element={<GroupBarChart />} />
          <Route path="/tree-map" element={<TreeMap />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

