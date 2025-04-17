// src/contexts/Theme.js
import React, { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import "../App.css";

const ThemeContext = createContext();

const lightPalette = {
  primary: {
    main: "#E85A4F",
  },
  secondary: {
    main: "#E98074",
  },
  background: {
    default: "#EAE7DC",
    paper: "#D8C3A5",
  },
  text: {
    primary: "#212A31",
    secondary: "#2E3944",
  },
};

const darkPalette = {
  primary: {
    main: "#212A31",
  },
  secondary: {
    main: "#2E3944",
  },
  background: {
    default: "#212A31",
    paper: "#748D92",
  },
  text: {
    primary: "#D3D9D4",
    secondary: "#8E8D8A",
  },
};

export const ThemeProviderWrapper = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: darkMode ? darkPalette : lightPalette,
  });

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

ThemeProviderWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useThemeContext = () => useContext(ThemeContext);
