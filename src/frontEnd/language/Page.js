import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery, IconButton } from "@mui/material"; //Button, Typography, Box
import { useTheme } from "@mui/styles";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ColorLensIcon from '@mui/icons-material/ColorLens';
import FormatSizeIcon from '@mui/icons-material/FormatSize';

import { useLanguageContext, languages } from "../../contexts/Language";

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

// Define the paths to the GIFs and images
const gifPaths = [
  "signs/sign-language-spanish.gif",
  "signs/sign-language-us.gif",
  "signs/sign-language-uk.gif",
  "signs/sign-language-french.gif",
  "signs/sign-language-indi.gif",
];

const imagePaths = [
  "flag/spanish-flag.jpeg",
  "flag/us-flag.jpeg",
  "flag/uk-flag.jpeg",
  "flag/french-flag.jpeg",
  "flag/indi-flag.jpeg",
];

// Create the URLs using process.env.PUBLIC_URL
const gifUrls = gifPaths.map((path) => `${process.env.PUBLIC_URL}${path}`);
const imageUrls = imagePaths.map((path) => `${process.env.PUBLIC_URL}${path}`);

function LanguageMenu() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { setCurrentLanguageIndex } = useLanguageContext();
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });


  const [currentGifIndex, setCurrentGifIndex] = useState(0);

  const [currentColorScheme, setCurrentColorScheme] = useState(() => {
    const savedScheme = localStorage.getItem("currentColorScheme");
    return savedScheme ? JSON.parse(savedScheme) : "theme1";
  });

  const [currentFontSize, setCurrentFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem("currentFontSize");
    return savedFontSize ? JSON.parse(savedFontSize) : "defaultSize";
  });

  // Update localStorage when darkMode changes
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    const handleResize = () => {
      // setHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("currentColorScheme", JSON.stringify(currentColorScheme));
  }, [currentColorScheme]);

  useEffect(() => {
    localStorage.setItem("currentFontSize", JSON.stringify(currentFontSize));
  }, [currentFontSize]);

  // Cycle through GIFs
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

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

  const handleBack = () => {
    navigate("/");
  };

  const handlePrevLanguage = () => {
    setCurrentLanguageIndex((prevIndex) =>
      prevIndex === 0 ? languages.length - 1 : prevIndex - 1,
    );
    setCurrentGifIndex((prevIndex) =>
      prevIndex === 0 ? gifUrls.length - 1 : prevIndex - 1,
    );
  };

  const handleNextLanguage = () => {
    setCurrentLanguageIndex((prevIndex) =>
      prevIndex === languages.length - 1 ? 0 : prevIndex + 1,
    );
    setCurrentGifIndex((prevIndex) =>
      prevIndex === gifUrls.length - 1 ? 0 : prevIndex + 1,
    );
  };

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
        <div className="flex flex-col items-center">
          <img
            src={gifUrls[currentGifIndex]}
            alt="GIF"
            className="mb-8"
            style={{ width: isSmallScreen ? "200px" : "400px" }}
          />
          <div className="flex items-center">
            <ArrowBackIcon
              className="mx-4 cursor-pointer"
              style={{ fontSize: isSmallScreen ? "2rem" : "3rem" }}
              onClick={handlePrevLanguage}
            />
            <div
              className={`text-center ${isSmallScreen ? currentFont.text : currentFont.textSmallScreen}`}
            >
              {languages[currentGifIndex]}
            </div>
            <ArrowForwardIcon
              className="mx-4 cursor-pointer"
              style={{ fontSize: isSmallScreen ? "2rem" : "3rem" }}
              onClick={handleNextLanguage}
            />
          </div>
          <img
            src={imageUrls[currentGifIndex]}
            alt="Corresponding Image"
            className=""
            style={{ width: isSmallScreen ? "1rem" : "2rem" }}
          />
        </div>

        <div
          //className={`${isSmallScreen ? "text-base py-2 px-4" : "text-lg py-2 px-8"}`}
          className={`${isSmallScreen ? currentFont.text : currentFont.textSmallScreen}`}
          onClick={handleBack}
        >
          Back
        </div>
      </div>
    </div >
  );
}

export default LanguageMenu;
