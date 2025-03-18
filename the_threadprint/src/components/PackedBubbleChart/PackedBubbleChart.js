// import React from 'react';
// import { useEffect, useRef, useState } from 'react';
// import * as d3 from "d3"; //D3.js


// const PackedBubbleChart = () => {
//     const [data,setData] = useState([]);
//     const svgRef = useRef();


//      useEffect (() => { //fetch api from public folder
//             fetch("/Plastic based textiled in clothing industry.json")
//             .then((response) => response.json())
//             // .then((jsonData) => setData(jsonData))
//             .then((jsonData) => {
//                 setData(jsonData);
//               })
//             .catch((error) => console.error ("Error loading JSON:", error));
//         }, []);

//         var simulation = d3
//         .forceSimulation(data.nodes)
//         .force("charge", d3.forceManyBody().strength(300))
//         .force("center", d3.forceCenter(width / 2, height / 2))
//         .force("collide", d3.forceCollide(30).strength(0.7))
//         .on("ticked",ticked)

//     return (
//         <div>
//       {/* <h1>Treemap of {sizeEncoding.replace("_", " ")} by Company & Product</h1>
//       <h2 id = 'description'> Give me Head Top Top Top</h2>
//       <svg id = 'canvas'></svg> */}
//       <h1>Bubble Chart Data Processing</h1>
//       <p>Check the console for sorted hierarchical data.</p>
//     </div>
//     );
// }
// export default PackedBubbleChart;
