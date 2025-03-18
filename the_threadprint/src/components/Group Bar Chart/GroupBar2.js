import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
// import './GroupedBarChart.css';

const GroupedBarChart = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const svgRef = useRef();

  useEffect(() => {
    fetch("/Plastic based textiled in clothing industry.json") // Update with actual data path
      .then(response => response.json())
      .then(jsonData => {
        setData(jsonData);
        const uniqueYears = [...new Set(jsonData.map(d => d.production_year))].sort();
        setSelectedYear(uniqueYears[0]); // Default to first year
      })
      .catch(error => console.error("Error loading JSON:", error));
  }, []);

  useEffect(() => {
    if (!data.length || selectedYear === null) return;

    // Filter data based on selected year
    const yearlyData = data.filter(d => d.production_year === selectedYear);

    // Group by company and product type
    const groupedData = d3.groups(yearlyData, d => d.Company, d => d.Product_Type).map(([company, products]) => ({
      company,
      products: products.map(([productType, items]) => ({
        productType,
        value: d3.sum(items, d => +d.Monetary_Value || 0)
      }))
    }));

    setFilteredData(groupedData);
  }, [data, selectedYear]);

  useEffect(() => {
    if (!filteredData.length) return;

    // Set dimensions
    const width = 900, height = 500, margin = { top: 40, right: 30, bottom: 80, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Select SVG and clear previous content
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    // Extract unique product types for color mapping
    const productTypes = [...new Set(data.map(d => d.Product_Type))];

    // Create scales
    const x0 = d3.scaleBand()
      .domain(filteredData.map(d => d.company))
      .range([0, innerWidth])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(productTypes)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData.flatMap(d => d.products.map(p => p.value)))])
      .nice()
      .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(productTypes)
      .range(d3.schemeCategory10);

    // Append the chart group
    const chartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Axis
    chartGroup.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("transform", "rotate(-25)")
      .style("text-anchor", "end");

    // Y Axis
    chartGroup.append("g")
      .call(d3.axisLeft(y));

    // Create groups for each company
    const companyGroups = chartGroup.selectAll(".company-group")
      .data(filteredData)
      .enter()
      .append("g")
      .attr("class", "company-group")
      .attr("transform", d => `translate(${x0(d.company)},0)`);

    // Draw bars
    companyGroups.selectAll("rect")
      .data(d => d.products)
      .enter()
      .append("rect")
      .attr("x", d => x1(d.productType))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => innerHeight - y(d.value))
      .attr("fill", d => colorScale(d.productType));

    // // Add labels on top of bars
    // companyGroups.selectAll("text")
    //   .data(d => d.products)
    //   .enter()
    //   .append("text")
    //   .attr("x", d => x1(d.productType) + x1.bandwidth() / 2)
    //   .attr("y", d => y(d.value) - 5)
    //   .attr("text-anchor", "middle")
    //   .text(d => d.value.toFixed(2))
    //   .attr("font-size", "12px")
    //   .attr("fill", "black");

  }, [filteredData]);

  return (
    <div>
      <h1>Grouped Bar Chart: Monetary Value by Company</h1>
      
      <label>Filter by Year:</label>
      <select onChange={(e) => setSelectedYear(Number(e.target.value))} value={selectedYear}>
        {[...new Set(data.map(d => d.production_year))].sort().map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <svg ref={svgRef}></svg>
    </div>
  );
};

export default GroupedBarChart;
