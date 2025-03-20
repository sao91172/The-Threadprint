import React from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css"; // Importing CSS module
import threadprintCover from "../../img/Threadprint_cover1.jpg";
import threadprintSign from "../../img/THE THREADPRINT.png";

const Home = () => {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.fontPic}>
        <div className={styles.buttonFrame}>
          {/* Navigation Buttons */}
          <Link to="/bubble-chart">
            <button className={styles.buttonStyle}>Bubble Chart</button>
          </Link>
          <Link to="/bar-chart">
            <button className={styles.buttonStyle}>Bar Chart</button>
          </Link>
          <Link to="/tree-map">
            <button className={styles.buttonStyle}>Tree Map</button>
          </Link>
        </div>
        <p className={styles.pStyle}>
          This project quantifies and visualizes the presence of plastic-based
          textiles in the fashion industry, enabling data-driven insights for
          sustainability strategies.
          <br />
          <br />
          The mission is to bring awareness to the significant environmental
          consequences of fast fashion’s unsustainable practices by leveraging
          data-driven insights, with a particular emphasis on the role of
          plastic-based textiles in contributing to this issue.
        </p>
      </div>

      <div className={styles.threadprintImage}>
        {/* <h1 className={styles.h1Style}> The Threadprint</h1> */}
        <img
          className={styles.imgStyleSign}
          src={threadprintSign}
          alt="sign"
        />
        <img
          className={styles.imgStyle}
          src={threadprintCover}
          alt="Chair of clothes"
        />
      </div>

      <div className="copy-right"></div>
      <p>© 2024 by Sarah Orji. All rights reserved.</p>
    </div>
  );
};

export default Home;
