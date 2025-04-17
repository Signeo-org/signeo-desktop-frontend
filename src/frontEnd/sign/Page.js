// src/frontEnd/sign/Page.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useMediaQuery} from "@mui/material"; //Button, Typography, Box
import { useTheme } from "@mui/styles";

function SignPage() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode) {
      try {
        return JSON.parse(savedDarkMode);
      } catch (e) {
        console.error("Error parsing darkMode from localStorage", e);
        return false;
      }
    }
    return false;
  });

  const [signs, setSigns] = useState([]);

  useEffect(() => {
    const fetchSigns = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/sign");
        setSigns(response.data.sign);
        console.log("Signs:", response.data.sign);
      } catch (error) {
        console.error("Error fetching signs:", error);
      }
    };

    fetchSigns();

    const intervalId = setInterval(fetchSigns, 1000);

    return () => clearInterval(intervalId);
  }, []);
  const renderSignVideos = () => {
    return signs.map((sign, index) => (
      <div key={index} className="w-full flex justify-center mb-4">
        <img
          src={`${process.env.PUBLIC_URL}/signs/${sign}.gif`}
          alt="GIF"
          className="mb-8"
          // style={{ width: isSmallScreen ? "200px" : "400px" }}
        />
      </div>
    ));
  };

  return (
    <div
      className={`flex flex-col items-center justify-center h-screen ${darkMode ? "bg-darkTheme-dark1 text-blue-100" : "bg-whiteTheme-light1 text-whiteTheme-accent1"}`}
    >
      {signs.length > 0 ? <>{renderSignVideos()}</> : <h1>Loading...</h1>}
    </div>
  );
}

export default SignPage;
