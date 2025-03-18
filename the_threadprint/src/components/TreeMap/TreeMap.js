import React, { useCallback } from "react";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3"; //D3.js
import "./TreeMap.css";

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

  //come back to GroupSort
  useEffect(() => {
    //Ensure dependencies before running
    if (!data || !sizeEncoding) return; //if data is missing (null, undefined, or falsy)
    const nestedData = {
      //Convert flat JSON to hierarchical format based on the selected size encoding
      name: "root",
      children: d3
        .groups(data, (d) => d.Company)
        .map(([company, products]) => ({
          name: company,
          children: d3
            .groupSort(products, (d) => d.Product_Type)
            .map(([productType, items]) => ({
              name: productType,
              value: d3.sum(items, (d) => +d[sizeEncoding] || 0), // Ensures safe access
            })), //map-products
        })), //map-groups
    }; //nestedData
    drawTreeMap(); //call function
  }, [data, sizeEncoding, dimensions, drawTreeMap]); // UseEffect: Re-run when data or size encoding changes

  //comeback to callnback
  let drawTreeMap = useCallback((nestedData) => {
    //where we're going to build the tree

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
      .padding(4) // Add padding to avoid overcrowding
      .round(true); // Round for clarity;
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

    svg.selectAll("*").remove();
    // Create a color scale for different product types
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Draw the company nodes (parent level)
    const companies = svg
      .selectAll("g.company")
      .data(hierarchy.children)
      .enter()
      .append("g")
      .attr("class", "company");
      
      // Add labels for company names positioned at the top-left of the company tile
      companies.each(function(d, i) {
        const stepWidth = (d.x1 - d.x0) / d.children.length;


    //We are using'g' here instead of direct rectangles since we want to add text to the tles
    //Create a new g element with the append() method and type of 'g'
    let block = canvas.selectAll("g").data(companyFiles).enter().append("g");
    block
      .append("rect")
      .attr("class", "tile")
      .attr("x", (d) => d.x0);
    // .attr("y", d => d.y0)
    // .attr("width", d => Math.max(0, d.x1 - d.x0)) // Prevent negative values
    // .attr("height", d => Math.max(0, d.y1 - d.y0))
    // .attr("fill", "teal")
    // .attr("stroke", "white"); // Improve visibility

    //   console.log("Rendered TreeMap", hierarchy);

    // Cleanup function ensures SVG is cleared on unmount or re-render
    return () => svg.selectAll("*").remove();
  });

  return (
    <div>
      {/* <h1>Treemap of {sizeEncoding.replace("_", " ")} by Company & Product</h1>
      <h2 id = 'description'> Give me Head Top Top Top</h2>
      <svg id = 'canvas'></svg> */}
      <h1>Treemap of {sizeEncoding.replace("_", " ")} by Company & Product</h1>s
      <svg ref={svgRef}></svg>
    </div>
  );
};
export default TreeMap;
