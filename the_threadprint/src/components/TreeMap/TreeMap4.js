import React from "react";
import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3"; //D3.js
import "./TreeMap.css";

const TreeMap = () => {
  const [data, setData] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const [sizeEncoding, setSizeEncoding] = useState("Greenhouse_Gas_Emissions");
  const svgRef = useRef();

  useEffect(() => {
    fetch("/Plastic based textiled in clothing industry.json")
      .then((response) => response.json())
      .then((jsonData) => setData(jsonData))
      .catch((error) => console.error("Error loading JSON:", error));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.7,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const drawTreeMap = useCallback(
    (nestedData) => {
      if (!nestedData || !svgRef.current) return;
  
      console.log("📌 Drawing TreeMap with data:", nestedData);
  
      let hierarchy = d3
        .hierarchy(nestedData, (node) => node.children)
        .sum((node) => node.value)
        .sort((node1, node2) => node2.value - node1.value);
  
      console.log("🧐 Hierarchy Leaves:", hierarchy.leaves()); // Debugging: Ensure multiple groups exist
  
      let createTreeMap = d3
        .treemap()
        .size([dimensions.width, dimensions.height])
        .paddingOuter(10)
        .paddingInner(3)
        .round(true);
  
      createTreeMap(hierarchy);
  
      let svg = d3
        .select(svgRef.current)
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);
  
      // **Persistent Color Mapping**
      const productTypes = [...new Set(hierarchy.leaves().map((d) => d.data.name))]; // Unique product names
      const colorScale = d3
        .scaleOrdinal()
        .domain(productTypes)
        .range([
          "#8FA17A", "#F79D87", "#ECBA96", "#FFF1D8", "#BC524F",
          "#7C9CAF", "#519698", "#FA6867", "#A7D996", "#0973A4", "#FFA9AD"
        ]);
  
      // **Ensure container exists**
      let container = svg.select(".treemap-container");
      if (container.empty()) {
        container = svg.append("g").attr("class", "treemap-container");
      }
  
      // **DATA JOIN: Ensure Unique Keys**
        let nodes = container
        .selectAll("g.product-type")
        .data(hierarchy.leaves().forEach((d, i) => (d.productType = `node-${i}`))
    ); // Use a stable identifier
      
      console.log("✅ Nodes entering:", nodes.enter().size());
      console.log("✅ Nodes updating:", nodes.size());
      console.log("✅ Nodes exiting:", nodes.exit().size());
      console.log("👀 Unique IDs in data:", hierarchy.leaves().map(d => d.data.id));
      console.log("💀 Exiting nodes:", nodes.exit().size());
      
      // **ENTER: Append new nodes**
      let enterNodes = nodes.enter()
        .append("g")
        .attr("class", "product-type")
        .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`);
  
      enterNodes.append("rect")
        .attr("class", "tile")
        .attr("width", 0)
        .attr("height", 0)
        .attr("opacity", 0.7)
        .attr("fill", (d) => colorScale(d.data.name))
        .transition()
        .duration(1000)
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0);
  
      enterNodes.append("text")
        .attr("x", 4)
        .attr("y", 14)
        .attr("opacity", 0)
        .text((d) => d.data.name)
        .attr("font-size", "12px")
        .attr("fill", "white")
        .transition()
        .duration(1000)
        .attr("opacity", 1);
  
      // **UPDATE: Update existing nodes**
      let updateNodes = nodes.merge(enterNodes);
  
      updateNodes.transition()
        .duration(1000)
        .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`);
  
      updateNodes.select("rect")
        .transition()
        .duration(1000)
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("fill", (d) => colorScale(d.data.name)); // Keep colors consistent
  
      updateNodes.select("text")
        .transition()
        .duration(1000)
        .attr("x", (d) => (d.x1 - d.x0) / 2)
        .attr("y", (d) => (d.y1 - d.y0) / 2)
        .attr("opacity", 1);
  
      // **EXIT: Remove old nodes**
      nodes.exit()
        .transition()
        .duration(1000)
        .attr("opacity", 0)
        .remove();
  
      return () => svg.selectAll("*").remove();
    },
    [data, dimensions]
  );
  
  
  
  
  

  useEffect(() => {
    if (!data || !sizeEncoding) return;
    if (data.length > 0) {
      const nestedData = {
        name: "root",
        children: d3
          .groups(data, (d) => d.Company)
          .map(([company, products]) => ({
            name: company,
            children: d3
              .groups(products, (d) => d.Product_Type)
              .map(([productType, items]) => ({
                name: productType,
                value: d3.sum(items, (d) => +d[sizeEncoding] || 0),
              })),
          })),
      };
      drawTreeMap(nestedData);
    }
  }, [data, sizeEncoding, dimensions, drawTreeMap]);

  return (
    <div>
      <h1>Treemap of {sizeEncoding.replace("_", " ")} by Company & Product</h1>
      <button onClick={() => setSizeEncoding("Greenhouse_Gas_Emissions")}>
        Greenhouse Gas Emissions
      </button>
      <button onClick={() => setSizeEncoding("Pollutants_Emitted")}>
        Pollutants Emitted
      </button>
      <button onClick={() => setSizeEncoding("Water_Consumption")}>
        Water Consumption
      </button>
      <button onClick={() => setSizeEncoding("Energy_Consumption")}>
        Energy Consumption
      </button>
      <button onClick={() => setSizeEncoding("Waste_Generation")}>
        Waste Generation
      </button>
      <button onClick={() => setSizeEncoding("Sales_Revenue")}>
        Sales Revenue
      </button>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default TreeMap;