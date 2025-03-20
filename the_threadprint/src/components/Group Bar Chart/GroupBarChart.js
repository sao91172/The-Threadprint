import React from "react";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3"; //D3.js
import styles from "./GroupBarChart.module.css";

const GroupBarChart = () => {
  const [data, setData] = useState([]); //useState is used to keep track of the state
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 }); //make bar chart responsive
  const [selectedYear, setSelectedYear] = useState(null);
  const svgRef = useRef();

  /**
   * The user will be able to switch metrics (i.e Production_Year) based on buttons so we need to have state Managements based on filter
   */
  const [filteredData, setFilteredData] = useState([]); //default metric

  useEffect(() => {
    //fetch api from public folder
    fetch("/Plastic based textiled in clothing industry.json")
      .then((response) => response.json())
      // .then((jsonData) => setData(jsonData))
      .then((jsonData) => {
        setData(jsonData);

        //Extract unique years
        const uniqueYears = [
          ...new Set(jsonData.map((d) => d.Production_Year)),
        ].sort();
        setSelectedYear(uniqueYears[0]); // Default to first year
      })
      .catch((error) => console.error("Error loading JSON:", error));
  }, []);

  //Responsive Group Bar Chart
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

  //Re-render chart when selectedYear or data changes
  useEffect(() => {
    // if (!selectedYear || !data) return;
    if (!data.length || selectedYear === null) return;

    //Filter data based on selected year
    let filteredData = data.filter((d) => d.Production_Year === selectedYear);

    let groupedData = d3
      .groups(
        filteredData,
        (d) => d.Company,
        (d) => d.Product_Type
      )
      .map(([company, product]) => ({
        company,
        product: product.map(([productType, items]) => ({
          productType,
          value: d3.sum(items, (d) => +d.Sales_Revenue || 0),

          // Aggregate other fields (sum, average, etc.)
          Greenhouse_Gas_Emissions: d3.sum(
            items,
            (d) => +d.Greenhouse_Gas_Emissions || 0
          ),
          Pollutants_Emitted: d3.sum(items, (d) => +d.Pollutants_Emitted || 0),
          Water_Consumption: d3.sum(items, (d) => +d.Water_Consumption || 0),
          Energy_Consumption: d3.sum(items, (d) => +d.Energy_Consumption || 0),
          Waste_Generation: d3.sum(items, (d) => +d.Waste_Generation || 0),
        })),
      }));
    setFilteredData(groupedData);
  }, [data, selectedYear]);

  useEffect(() => {
    if (!filteredData.length) return;
    console.log("Re-rendering chart..."); // Debugging: Ensure this logs!

    //Define margins (margin-bottom to accomdate for x-axis)
    const margin = { top: 50, right: 150, bottom: 100, left: 30 };

    // Select the SVG and clear previous drawings.
    let svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
      .attr("width", dimensions.width + margin.left + margin.right)
      .attr("height", dimensions.height + margin.top + margin.bottom)
      .attr("style", "max-width: 100%; height: 100%;  display: flex;")
      .attr("preserveAspectRatio", "xMidYMid meet") // 🚀 Ensures proper scaling
      .style("color", "#f0f0f0")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract unique product types for color mapping
    let productTypes = [...new Set(data.map((d) => d.Product_Type))];

    //Adding & Mapping x-axis with data (with Scales)
    let xScale0 = d3
      .scaleBand()
      .domain(filteredData.map((d) => d.company))
      .range([0, dimensions.width - margin.left - margin.right])
      .padding(0.2);

    let xScale1 = d3
      .scaleBand()
      .domain(productTypes)
      .range([0, xScale0.bandwidth()])
      .padding(0);

    let yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(filteredData.flatMap((d) => d.product.map((p) => p.value))),
      ])
      .nice()
      .range([dimensions.height - margin.top - margin.bottom, 0]);

    const colorScale = d3
      .scaleOrdinal()
      .domain(productTypes)
      .range(d3.schemeCategory10);

    //append the chart
    let chartGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top + 20})`);

    // X Axis
    chartGroup
      .append("g")
      .attr(
        "transform",
        `translate(0,${dimensions.height - margin.top - margin.bottom})`
      )
      .call(d3.axisBottom(xScale0))
      .selectAll("text")
      .attr("transform", "rotate(-25)")
      .style("text-anchor", "end");

    // Y Axis
    chartGroup.append("g").call(
      d3
        .axisLeft(yScale)
        .tickFormat((d) => (d === 0 ? "" : `$${(d / 1_000_000).toFixed(1)}M`)) // Convert to millions, add $
    );

    // Create groups for each company
    let companyGroups = chartGroup
      .selectAll(".company-group")
      .data(filteredData)
      .enter()
      .append("g")
      .attr("class", "company-group")
      .attr("transform", (d) => `translate(${xScale0(d.company)},0)`);

    // Draw bars
    companyGroups
      .selectAll("rect")
      .data((d) => d.product)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale1(d.productType))
      .attr("y", (d) => yScale(d.value))
      .attr("width", xScale1.bandwidth())
      .attr(
        "height",
        (d) => dimensions.height - margin.top - margin.bottom - yScale(d.value)
      )
      .attr("fill", (d) => colorScale(d.productType))
      .on("mouseover", (event, d) => {
        //console.log("Hovered Data:", d); // Check the structure of d
        const companyName = d3.select(event.target.parentNode).datum().company;

        tooltip.style("visibility", "visible").html(`
            <strong>Company:</strong> ${companyName} <br/>
            <strong>Product Type:</strong> ${d.productType} <br/>
            <strong>Greenhouse Gas Emissions:</strong> ${d3.format(".2f")(
              d.Greenhouse_Gas_Emissions
            )} tCO₂e <br/>
            <strong>Pollutants Emitted:</strong> ${d3.format(".2f")(
              d.Pollutants_Emitted
            )} kg <br/>
            <strong>Water Consumption:</strong> ${d3.format(".2f")(
              d.Water_Consumption
            )} m³ <br/>
            <strong>Energy Consumption:</strong> ${d3.format(".2f")(
              d.Energy_Consumption
            )} kWh <br/>
            <strong>Waste Generation:</strong> ${d3.format(".2f")(
              d.Waste_Generation
            )} kg <br/>
            <strong>Sales Revenue:</strong> $${(d.value / 1_000_000).toFixed(
              2
            )}M
          `);

      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    //Add labels on top of bars
    // companyGroups.selectAll("text")
    //   .data(d => d.product)
    //   .enter()
    //   .append("text")
    //   .attr("x", d => xScale1(d.productType) + xScale1.bandwidth() / 2)
    //   .attr("y", d => yScale(d.value) - 5)
    //   .attr("text-anchor", "middle")
    //   .text(d => d.value.toFixed(2))
    //   .attr("font-size", "12px")
    //   .attr("fill", "white");

    let tooltip = d3
      .select("div")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "white")
      .style("padding", "8px")
      .style("border-radius", "6px")
      .style("color", "black")
      .style("font-family", "Poppins, sans-serif");

    // Create a legend
    let legend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${dimensions.width - margin.right - 120}, ${margin.top -150})`
      );

    const legendItems = legend
      .selectAll(".legend-item")
      .data(colorScale.domain())
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legendItems
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", colorScale);

    legendItems
      .append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .style("fill", "#f0f0f0")
      .text((d) => d)
      .text((d) => d.replace(/_/g, " "));
    // Cleanup function ensures SVG is cleared on unmount or re-render
    return () => svg.selectAll("*").remove();
  }, [data, dimensions.height, dimensions.width, selectedYear, filteredData]);

  return (
    <div className={styles.chartContainer}>
      <div className="div-chart">
      <h1>Comparative Sales Revenue by Company and Product Type </h1>
      <label>Filter by Year:</label>
      <select
        onChange={(e) =>
          setSelectedYear(e.target.value ? Number(e.target.value) : null)
        }
        value={selectedYear || ""}
      >
        <option value="">-Select-</option> {/* Default option */}
        {[...new Set(data.map((d) => d.Production_Year))].sort().map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <svg className={styles.svgContainer} ref={svgRef}></svg>
    </div>
    </div>
    
  );
}; //GroupBarChart

export default GroupBarChart;
