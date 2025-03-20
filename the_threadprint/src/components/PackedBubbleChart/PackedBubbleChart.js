import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const PackedBubbleChart = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState({});
  const [selectedYear, setSelectedYear] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

  const svgRef = useRef();

  useEffect(() => {
    fetch("/Plastic based textiled in clothing industry.json")
      .then((response) => response.json())
      .then((jsonData) => {
        // const filteredData = jsonData.filter((d) => d.Production_Year === 2022);
        const uniqueYears = [
          ...new Set(jsonData.map((d) => d.Production_Year)),
        ].sort();
        setSelectedYear(uniqueYears[0]); // Default to first year

        const aggregatedData = d3
          .rollups(
            jsonData,
            (v) => ({
              revenue: d3.sum(v, (leaf) => +leaf.Sales_Revenue),
              metrics: [
                {
                  name: "Greenhouse Gas Emissions",
                  value: d3.sum(v, (leaf) => +leaf.Greenhouse_Gas_Emissions),
                  unit: "tCO₂e",
                },
                {
                  name: "Pollutants Emitted",
                  value: d3.sum(v, (leaf) => +leaf.Pollutants_Emitted),
                  unit: "kg)",
                },
                {
                  name: "Water Consumption",
                  value: d3.sum(v, (leaf) => +leaf.Water_Consumption),
                  unit: "m³",
                },
                {
                  name: "Energy Consumption",
                  value: d3.sum(v, (leaf) => +leaf.Energy_Consumption),
                  unit: "MWh",
                },
                {
                  name: "Waste Generation",
                  value: d3.sum(v, (leaf) => +leaf.Waste_Generation),
                  unit: "kg",
                },
              ],
            }),
            (d) => d.Company,
            (d) => d.Product_Type
          )
          .flatMap(([company, products]) =>
            products.map(([productType, jsonData]) => ({
              company,
              productType,
              revenue: jsonData.revenue,
              metrics: jsonData.metrics,
            }))
          );

      

        setData(aggregatedData);
        setFilteredData(aggregatedData.filter(d => d.Production_Year === setSelectedYear(uniqueYears[0]))); // Initial filtering
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [filteredData]);

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
    if (!data.length || selectedYear === null) return;
    let newFilteredData = data.filter((d) => d.Production_Year === selectedYear);
    setFilteredData(newFilteredData);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const pack = d3
      .pack()
      .size([dimensions.width, dimensions.height])
      .padding(3);

    const root = d3.hierarchy({ children: filteredData }).sum((d) => d.revenue || 0);
    const bubbles = pack(root).leaves();

    const colorPalette = {
      Linen: "#f49405",
      Wool: "#f0f921",
      Nylon: "#fcffa4",
      Cotton: "#fedd56",
      Tencel: "#fbaf40",
      Viscose: "#f38748",
      Polyester: "#df6951",
      Microfiber: "#c7475e",
      Recycled_Poly: "#a52c60",
      Synthetic_Blend: "#852676",
      Organic_Cotton: "#31137B",
    };

    svg
      .selectAll("circle")
      .data(bubbles, (d) => d.data.company + d.data.productType)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", (d) =>
        Object.keys(selectedCompanies).length === 0 ||
        selectedCompanies[d.data.company]
          ? colorPalette[d.data.productType] || "#ffad66"
          : "#7B7B7B"
      )
      .attr("opacity", (d) =>
        Object.keys(selectedCompanies).length === 0 ||
        selectedCompanies[d.data.company]
          ? 1
          : 0.3
      )
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 3);
        d3.select("#tooltip")
          .style("visibility", "visible")
          .text(
            `${d.data.company} - ${d.data.productType.replace(
              /_/g,
              " "
            )}: $${d.data.revenue.toLocaleString()}`
          );
      })
      .on("mousemove", function (event) {
        d3.select("#tooltip")
          .style("top", event.pageY + "px")
          .style("left", event.pageX + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
        d3.select("#tooltip").style("visibility", "hidden");
      });
      return () => svg.selectAll("*").remove();
  }, [filteredData, dimensions.width, dimensions.height, selectedCompanies, data, selectedYear]);

  const toggleCompanySelection = (company) => {
    setSelectedCompanies((prev) => {
      const newSelection = { ...prev };
      if (newSelection[company]) {
        delete newSelection[company];
      } else {
        newSelection[company] = true;
      }
      return newSelection;
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <h3>Filter by Year:</h3>
  <select
    value={selectedYear}
    onChange={(e) => setSelectedYear(Number(e.target.value))}
  >
    {[...new Set(data.map((item) => item.Production_Year))].sort().map((year) => (
      <option key={year} value={year}>
        {year}
      </option>
    ))}
  </select>
      {/* Company Filter */}
      <div>
        <h3>Filter by Company:</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[...new Set(data.map((item) => item.company))].map((company) => (
            <li
              key={company}
              onClick={() => toggleCompanySelection(company)}
              style={{
                cursor: "pointer",
                padding: "5px",
                backgroundColor: selectedCompanies[company]
                  ? "#ddd"
                  : "transparent",
              }}
            >
              {company}
            </li>
          ))}
        </ul>
      </div>

      {/* Bubble Chart */}
      <div id="chart-container" style={{ position: "relative", flexGrow: 1 }}>
        <svg ref={svgRef}></svg>
        <div
          id="tooltip"
          style={{
            position: "absolute",
            visibility: "hidden",
            background: "#333",
            color: "#fff",
            padding: "5px",
            borderRadius: "5px",
            fontSize: "12px",
          }}
        ></div>
      </div>

      {/* Product Type Legend */}
      <div>
        <h3>Product Type Legend:</h3>
        {Object.entries({
          Linen: "#f49405",
          Wool: "#f0f921",
          Nylon: "#fcffa4",
          Cotton: "#fedd56",
          Tencel: "#fbaf40",
          Viscose: "#f38748",
          Polyester: "#df6951",
          Microfiber: "#c7475e",
          Recycled_Poly: "#a52c60",
          Synthetic_Blend: "#852676",
          Organic_Cotton: "#31137B",
        }).map(([productType, color]) => (
          <div
            key={productType}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <div
              style={{
                width: "15px",
                height: "15px",
                backgroundColor: color,
                borderRadius: "50%",
              }}
            ></div>
            {productType.replace(/_/g, " ")}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackedBubbleChart;
