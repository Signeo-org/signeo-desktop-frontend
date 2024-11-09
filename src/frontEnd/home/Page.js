import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Switch, IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/styles";
import { InvertColors } from "@mui/icons-material";

import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ColorLensIcon from '@mui/icons-material/ColorLens';
import FormatSizeIcon from '@mui/icons-material/FormatSize';

import { useToggleContext } from "../../contexts/Toggle";

const ipcRenderer = window.require ? window.require("electron").ipcRenderer : null;

const colorSchemes = {
  theme1: {
    background_light: "bg-whiteThemeRed-light1",
    background_button_light: "bg-whiteThemeRed-dark1",
    text_light: "text-whiteThemeRed-dark1",
    background_dark: "bg-darkThemeGray-dark1",
    background_button_dark: "bg-darkThemeGray-light1",
    text_dark: "text-darkThemeGray-light1",
  },
  theme2: {
    background_light: "bg-whiteThemePurple-light1",
    background_button_light: "bg-whiteThemePurple-dark1",
    text_light: "text-whiteThemePurple-dark1",
    background_dark: "bg-darkThemeGreenGray-dark1",
    background_button_dark: "bg-darkThemeGreenGray-light1",
    text_dark: "text-darkThemeGreenGray-light1",
  },
  theme3: {
    background_light: "bg-whiteThemePink-light1",
    background_button_light: "bg-whiteThemePink-dark1",
    text_light: "text-whiteThemePink-dark1",
    background_dark: "bg-darkThemeYellow-dark1",
    background_button_dark: "bg-darkThemeYellow-light1",
    text_dark: "text-darkThemeYellow-light1",
  },
};

const fontSize = {
  defaultSize: {
    title: "text-8xl",
    text: "text-3xl",
    titleSmallScreen: "text-4xl",
    textSmallScreen: "text-2xl",
  },
  mediumSize: {
    title: "text-4xl",
    text: "text-2xl",
    titleSmallScreen: "text-2xl",
    textSmallScreen: "text-xl",
  },
  bigSize: {
    title: "text-9xl",
    text: "text-5xl",
    titleSmallScreen: "text-6xl",
    textSmallScreen: "text-3xl",
  },
};

function Home() {
  const { subtitles, setSubtitles, signLanguage, setSignLanguage } = useToggleContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  const [currentColorScheme, setCurrentColorScheme] = useState(() => {
    const savedScheme = localStorage.getItem("currentColorScheme");
    return savedScheme ? JSON.parse(savedScheme) : "theme1";
  });

  const [currentFontSize, setCurrentFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem("currentFontSize");
    return savedFontSize ? JSON.parse(savedFontSize) : "defaultSize";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("currentColorScheme", JSON.stringify(currentColorScheme));
  }, [currentColorScheme]);

  useEffect(() => {
    localStorage.setItem("currentFontSize", JSON.stringify(currentFontSize));
  }, [currentFontSize]);

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.send("toggle-sign-window", signLanguage);
    }
  }, [signLanguage]);

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.send("toggle-subtitle-window", subtitles);
    }
  }, [subtitles]);

  const handleDarkModeToggle = () => setDarkMode(!darkMode);

  const handleCurrentColorSchemeToggle = () => {
    const themeKeys = Object.keys(colorSchemes);
    const currentIndex = themeKeys.indexOf(currentColorScheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setCurrentColorScheme(themeKeys[nextIndex]);
  };

  const handleCurrentFontSizeToggle = () => {
    const fontSizeKeys = Object.keys(fontSize);
    const currentIndex = fontSizeKeys.indexOf(currentFontSize);
    const nextIndex = (currentIndex + 1) % fontSizeKeys.length;
    setCurrentFontSize(fontSizeKeys[nextIndex]);
  };

  const handleLanguageMenu = () => navigate("/language-menu");

  const currentScheme = colorSchemes[currentColorScheme];
  const currentFont = fontSize[currentFontSize];

  return (
    <div
      className={`flex flex-col h-screen p-4 ${darkMode ? currentScheme.background_dark : currentScheme.background_light} ${darkMode ? currentScheme.text_dark : currentScheme.text_light}`}
    >
      <div className="flex items-center">
        <div className="flex justify-start top-0">
          <IconButton onClick={handleCurrentColorSchemeToggle} color="inherit" className="absolute top-0 right-4">
            <ColorLensIcon />
          </IconButton>
        </div>

        <div className="flex justify-start top-0">
          <IconButton onClick={handleCurrentFontSizeToggle} color="inherit" className="absolute top-0 right-4">
            <FormatSizeIcon />
          </IconButton>
        </div>

        <div className={`flex mb-8 justify-center w-full ${isSmallScreen ? currentFont.title : currentFont.titleSmallScreen}`}>
          SIGNEO
        </div>

        <div className="flex justify-end top-0">
          <IconButton onClick={handleDarkModeToggle} color="inherit" className="absolute top-0 right-4">
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center mb-8">
          <div className={`${isSmallScreen ? currentFont.text : currentFont.textSmallScreen}`}>
            Subtitles
          </div>
          <div className="flex items-center mt-4">
            <img
              src={`${process.env.PUBLIC_URL}/no-subtitle.png`}
              alt="no_subtitle"
              className="mx-4"
              style={{
                width: isSmallScreen ? "4.2rem" : "5.2rem",
                height: isSmallScreen ? "4.2rem" : "5.2rem",
                filter: darkMode ? "invert(1)" : "",
              }}
            />
            <Switch
              checked={subtitles}
              onChange={() => setSubtitles(!subtitles)}
              sx={{ transform: "scale(1.25)" }}
            />
            <img
              src={`${process.env.PUBLIC_URL}/yes-subtitle.png`}
              alt="yes_subtitle"
              className="mx-4"
              style={{
                width: isSmallScreen ? "4.2rem" : "5.2rem",
                height: isSmallScreen ? "4.2rem" : "5.2rem",
                filter: darkMode ? "invert(1)" : "",
              }}
            />
          </div>
        </div>
        <div className="flex flex-col items-center mb-8">
          <div className={`${isSmallScreen ? currentFont.text : currentFont.textSmallScreen}`}>
            PIP Sign Language
          </div>
          <div className="flex items-center mt-4">
            <img
              src={`${process.env.PUBLIC_URL}/no-sign.png`}
              alt="no_sign"
              className="mx-4"
              style={{
                width: isSmallScreen ? "4.2rem" : "5.2rem",
                height: isSmallScreen ? "4.2rem" : "5.2rem",
                filter: darkMode ? "invert(1)" : "",
              }}
            />
            <Switch
              checked={signLanguage}
              onChange={() => setSignLanguage(!signLanguage)}
              sx={{ transform: "scale(1.25)" }}
            />
            <img
              src={`${process.env.PUBLIC_URL}/yes-sign.png`}
              alt="yes_sign"
              className="mx-4"
              style={{
                width: isSmallScreen ? "4rem" : "5rem",
                height: isSmallScreen ? "4rem" : "5rem",
                filter: darkMode ? "invert(1)" : "",
              }}
            />
          </div>
        </div>

        <div className={`flex flex-col items-center rounded-2xl ${darkMode ? currentScheme.background_button_dark : currentScheme.background_button_light}`}>
          <Button
            //className={`flex self-center mt-8 py-6 px-12 mb-8 ${isSmallScreen ? "text-base py-2 px-4" : "text-lg py-4 px-8"}`}
            className={`flex self-center mt-8 py-6 px-12 mb-8 ${isSmallScreen ? currentFont.text : currentFont.textSmallScreen}}`}
            onClick={handleLanguageMenu}
          >
            <img
              src={`${process.env.PUBLIC_URL}/button-language.png`}
              alt="language_icon"
              className="mx-4"
              style={{ width: isSmallScreen ? "15rem" : "15rem" }}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
