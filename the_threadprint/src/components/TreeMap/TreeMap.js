import React from "react";
import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3"; //D3.js
import styles from "./TreeMap.module.css";

const TreeMap = () => {
  /**
   * use State  allows us to track state in a function component.
   * State generally refers to data or properties that need to be tracking in an application.
   */
  const [data, setData] = useState([]); //useState is used to keep track of the state
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 }); //make treemap responsive

  /**
   * The user will be able to switch metrics based on buttons so we need to have state Managements based on size encoding
   */
  const [sizeEncoding, setSizeEncoding] = useState("Greenhouse_Gas_Emissions"); //default metric
  /**
   * use Ref is used to  access or hold a reference to a DOM element,
   * store previous values,
   * or manage any mutable value that needs to persist between renders.
   */
  const svgRef = useRef();

  useEffect(() => {
    //fetch api from public folder
    fetch("/Plastic based textiled in clothing industry.json")
      .then((response) => response.json())
      // .then((jsonData) => setData(jsonData))
      .then((jsonData) => {
        setData(jsonData);
      })
      .catch((error) => console.error("Error loading JSON:", error));
  }, []);

  //Responsive TreeMap
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.9, // 90% of viewport width
        height: window.innerHeight * 0.7, // 70% of viewport height
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial resize

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //comeback to callnback
  let drawTreeMap = useCallback(
    (nestedData) => {
      //where we're going to build the tree

      if (!nestedData) return;
      //canvas.selectAll("*").remove(); // Clears previous treemap

      // Create a hierarchy and sort
      let hierarchy = d3
        .hierarchy(nestedData, (node) => node.children) //returns children of the node
        // let hierarchy = d3.hierarchy(nestedData) //returns children of the node

        /**
         * //sum-> adds value to each node-we want the higher value to have the bigger tile.
         * Tells it which field to look at in any given node to categorize how to value the nodes 9
         */
        .sum((node) => node.value)
        /**
         * sort retruns a number for any given node we sort
         * where if it returns a pos # then node2 will go before node1 (if neg #-> node 1 before node2)
         *
         * node2.value - node1.value: returns a # -for any given node we sort
         * want to make sure the node with the highest value comes before the lower values
         */
        .sort((node1, node2) => node2.value - node1.value);

      //Gives any hierarchy to this method which will create a hiearchy & it will create a treemap-> put data into leaf nodes so we can start drawing rectangles
      let createTreeMap = d3
        .treemap()
        .size([dimensions.width, dimensions.height])
        .paddingOuter(15) // Add padding to avoid overcrowding
        .paddingInner(2)
        .round(true); // Round for clarity;

      // .paddingInner(5)
      // .paddingOuter(8)
      createTreeMap(hierarchy); //call function x0 & y0-> the coordinates in where the top left corner should go
      //y0 & y1 are where the right most bottom corner should go

      //only interested in the leaf nodes -> nodes without children
      // let companyFiles = hierarchy.leaves();
      // console.log(companyFiles);

      //Select the SVG & clear previous drawings
      let svg = d3
        .select(svgRef.current)
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

      // .attr("width", dimensions.width)
      // .attr("height", dimensions.height);

      svg.selectAll("*").remove();
      // Create a color scale for different product types
      const colorScale = d3
        .scaleOrdinal()
        .domain(data.map((d) => d.Product_Type))
        .range([
          "#8FA17A",
          "#F79D87",
          "#ECBA96",
          "#FFF1D8",
          "#BC524F",
          "#7C9CAF",
          "#519698",
          "#FA6867",
          "#A7D996",
          "#0973A4",
          "#FFA9AD",
        ]);

      //We are using'g' here instead of direct rectangles since we want to add text to the tles
      //Create a new g element with the append() method and type of 'g'
      // Draw product type nodes
      let nodes = svg
        .selectAll("g.company")
        .data(hierarchy.leaves())
        .enter()
        .append("g")
        .attr("class", "product-type")
        .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`);

      // Add rectangles with color based on Product_Type
      nodes
        .append("rect")
        .attr("class", "tile")
        .attr("width", (d) => Math.max(0, d.x1 - d.x0)) // Prevent negative values
        .attr("height", (d) => Math.max(0, d.y1 - d.y0))
        .attr("fill", (d) => colorScale(d.data.name))
         .on("mouseover", (event, d) => {

                d3.select(event.target)
                .transition()
                .duration(200) // Smooth transition
                .style("fill", "orange"); // Change to any color
        
                tooltip.style("visibility", "visible").html(`
                    <strong>Company:</strong> ${d.parent.data.name} <br/>
                    <strong>Company:</strong> ${d.data.name.replace(/_/g, " ")} <br/>
                    <strong>Value:</strong> ${d3.format(",.2f")(d.value / 1e3)}K
                  `);
        
              })
              .on("mousemove", (event) => {
                tooltip
                  .style("top", `${event.pageY - 10}px`)
                  .style("left", `${event.pageX + 10}px`);
              })
              .on("mouseout", (event,d) => {
                d3.select(event.target)
                .transition()
                .duration(200)
                .style("fill", d => colorScale(d.data.name)); // Reset to original color
                tooltip.style("visibility", "hidden");
              });

      // Add labels for product types
      nodes
        .append("text")
        .attr("x", 4)
        .attr("y", 14)
        .text((d) => d.data.name.replace(/_/g, " "))
        .attr("font-size", "12px")
        .attr("fill", "white");

      // Display the selected encoding value (e.g., Greenhouse_Gas_Emissions)
      nodes
        .append("text")
        .attr("x", (d) => (d.x1 - d.x0) / 2) // Position in the center of each rectangle
        .attr("y", (d) => (d.y1 - d.y0) / 2) // Position vertically in the center
        .text((d) => d.data.value) // Display the value, formatted to 2 decimal places
        .attr("font-size", "12px")
        .attr("fill", "black")
        .attr("text-anchor", "middle"); // Center the value text horizontally and vertically
      //   console.log("Rendered TreeMap", hierarchy);

      // Draw the company nodes (parent level)
      const companies = svg
        .selectAll("g.company")
        .data(hierarchy.children)
        .enter()
        .append("g")
        .attr("class", "company");

      // Add labels for company names positioned at the top-left of the company tile
      companies.each(function (d, i) {
        const stepWidth = (d.x1 - d.x0) / d.children.length;

        // Add a label for each company at the top-left of the company tile
        d3.select(this)
          .selectAll("text")
          .data([d])
          .enter()
          .append("text")
          .attr("x", (d) => d.x0 + (d.x1 - d.x0) / 10) // Position closer to the left of the company tile
          .attr("y", (d) => d.y0 + 5) // Position near the top of the company tile
          .text((d) => d.data.name)
          .attr("font-size", "16px")
          .attr("fill", "black")
          .attr("text-anchor", "start"); // Align the text to the left
      }); //companies.each

        // Create a legend
      
    // Ensure the legend container is cleared before appending new elements
d3.select("#legend-container").html(""); 

// Append the legend to the legend container (not inside SVG)
let legend = d3
  .select("#legend-container")
  .append("svg") // Use a separate SVG for the legend
  .attr("width", 250) // Adjust width as needed
  .attr("height", colorScale.domain().length * 27) // Adjust height based on the number of items
  .append("g")
  .attr("class", "legend")
  .attr("transform", "translate(20, 20)");

// Create legend items
const legendItems = legend
  .selectAll(".legend-item")
  .data(colorScale.domain())
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("transform", (d, i) => `translate(0, ${i * 25})`);

// Append color boxes
legendItems
  .append("rect")
  .attr("width", 18)
  .attr("height", 18)
  .attr("fill", colorScale);

// Append text labels
legendItems
  .append("text")
  .attr("x", 24)
  .attr("y", 9)
  .attr("dy", "0.35em")
  .style("fill", "#000") // Adjust text color if necessary
  .style("font-size", "14px")
  .text((d) => d.replace(/_/g, " ")); // Format names properly

// Tooltip for hover interactions
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "rgba(0, 0, 0, 0.7)")
  .style("color", "#fff")
  .style("padding", "8px")
  .style("border-radius", "5px")
  .style("font-size", "12px")
  .style("visibility", "hidden");

  
      // Cleanup function ensures SVG is cleared on unmount or re-render
      return () => svg.selectAll("*").remove();
    },
    [data, dimensions]
  );

  useEffect(() => {
    //Ensure dependencies before running
    if (!data || !sizeEncoding) return; //if data is missing (null, undefined, or falsy)
    if (data.length > 0) {
      const nestedData = {
        //Convert flat JSON to hierarchical format based on the selected size encoding
        name: "root",
        children: d3
          .groups(data, (d) => d.Company)
          .map(([company, products]) => ({
            name: company,
            children: d3
              .groups(products, (d) => d.Product_Type)
              .map(([productType, items]) => ({
                name: productType,
                value: d3.sum(items, (d) => +d[sizeEncoding] || 0), // Ensures safe access
              })), //map-products
          })), //map-groups
      };
      drawTreeMap(nestedData); //call function
    } //nestedData
  }, [data, sizeEncoding, dimensions, drawTreeMap]); // UseEffect: Re-run when data or size encoding changes

  return (
    <div className={styles.divMap}>
      <h1>Treemap of {sizeEncoding.replaceAll("_", " ")} by Company & Product</h1>
      
      <button className={styles.buttonMapStyle} onClick={() => setSizeEncoding("Greenhouse_Gas_Emissions")}>Greenhouse Gas Emissions </button>
      <button className={styles.buttonMapStyle} onClick={() => setSizeEncoding("Pollutants_Emitted")}>Pollutants Emitted </button>
      <button className={styles.buttonMapStyle} onClick={() => setSizeEncoding("Water_Consumption")}> Water Consumption </button>
      <button className={styles.buttonMapStyle} onClick={() => setSizeEncoding("Energy_Consumption")}> Energy Consumption </button>
      <button className={styles.buttonMapStyle} onClick={() => setSizeEncoding("Waste_Generation")}> Waste Generation</button>
      <button className={styles.buttonMapStyle} onClick={() => setSizeEncoding("Sales_Revenue")}> Sales Revenue</button>
    
      
     
      <svg ref={svgRef}></svg>

       <div id="legend-container" style={{ position: "relative", top: "10px", right: "10px", height:"auto" }}></div>
    </div>
  );
};
export default TreeMap;
