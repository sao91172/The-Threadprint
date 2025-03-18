import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './TreeMap.css';

const TreeMap = () => {
  // Data state and responsive dimensions
  const [data, setData] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const [sizeEncoding, setSizeEncoding] = useState("Greenhouse_Gas_Emissions");
  const svgRef = useRef();

  // Fetch data
  useEffect(() => {
    fetch("/Plastic based textiled in clothing industry.json")
      .then(response => response.json())
      .then(jsonData => setData(jsonData))
      .catch(error => console.error("Error loading JSON:", error));
  }, []);

  // Responsive dimensions
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.7,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // initial call

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    // Build hierarchical data:
    const nestedData = {
      name: "root",
      children: d3.groups(data, d => d.Company).map(([company, products]) => ({
        name: company,
        children: d3.groups(products, d => d.Product_Type).map(([productType, items]) => ({
          name: productType,
          value: d3.sum(items, d => +d[sizeEncoding] || 0)
        }))
      }))
    };

    // Build the hierarchy.
    const root = d3.hierarchy(nestedData, d => d.children)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    // Create a treemap layout
    const treemapLayout = d3.treemap()
      .size([dimensions.width, dimensions.height])
      .paddingInner(5)
      .paddingOuter(8);

    treemapLayout(root);

    // Select the SVG and clear previous drawings.
    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    svg.selectAll("*").remove();

    // Create a color scale for different product types
    //const colorScale = d3.scaleOrdinal(d3.schemeSet3);
    const colorScale = d3.scaleOrdinal()
    .domain(data)
    .range(['#8fa17a','#f79d87','#ecba96','#FFF1D8','#BC524F','#7C9CAF','#519698','#FA6867','#A7D996','#0973A4','#FFA9AD']);

    // Draw the company nodes (parent level)
    const companies = svg.selectAll("g.company")
      .data(root.children)
      .enter()
      .append("g")
      .attr("class", "company");

    // Add labels for company names positioned at the top-left of the company tile
    companies.each(function(d, i) {
      const stepWidth = (d.x1 - d.x0) / d.children.length;
      
      // Add a label for each company at the top-left of the company tile
      d3.select(this).selectAll("text")
        .data([d])
        .enter()
        .append("text")
        .attr("x", d => d.x0 + (d.x1 - d.x0) / 10)  // Position closer to the left of the company tile
        .attr("y", d => d.y0 + 5)  // Position near the top of the company tile
        .text(d => d.data.name)
        .attr("font-size", "16px")
        .attr("fill", "blue")
        .attr("text-anchor", "start");  // Align the text to the left
    });

    // Draw product type nodes (rectangles)
    const nodes = svg.selectAll("g.product-type")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("class", "product-type")
      .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

    // Add rectangles with color based on Product_Type
    nodes.append("rect")
      .attr("class", "tile")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => colorScale(d.data.name));

    // Add labels for product types
    nodes.append("text")
      .attr("x", 4)
      .attr("y", 14)
      .text(d => d.data.name)
      .attr("font-size", "12px")
      .attr("fill", "white");

    // Display the selected encoding value (e.g., Greenhouse_Gas_Emissions)
    nodes.append("text")
      .attr("x", d => (d.x1 - d.x0) / 2)  // Position in the center of each rectangle
      .attr("y", d => (d.y1 - d.y0) / 2)  // Position vertically in the center
      .text(d => d.data.value.toFixed(2))  // Display the value, formatted to 2 decimal places
      .attr("font-size", "12px")
      .attr("fill", "black")
      .attr("text-anchor", "middle");  // Center the value text horizontally and vertically
  }, [data, sizeEncoding, dimensions]);

  return (
    <div>
      <h1>Treemap of {sizeEncoding.replace("_", " ")} by Company & Product</h1>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default TreeMap;
