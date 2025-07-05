// src/contexts/Settings.jsx
import PropTypes from "prop-types";
import React, { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext();

const AVAILABLE_LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' }
];

export const SettingsProvider = ({ children }) => {
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("appSettings");
    return saved
      ? JSON.parse(saved)
      : {
          subtitles: true,
          signLanguage: true,
          fontSize: "Medium",
          audioInput: "Microphone 1",
          language: AVAILABLE_LANGUAGES.some(lang => lang.code === navigator.language) 
    ? navigator.language 
    : "en-US",
        };
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

  // Update individual setting
  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const contextValue = {
    ...settings,
    availableLanguages: AVAILABLE_LANGUAGES,
    updateSetting,
    setSubtitles: (value) => updateSetting("subtitles", value),
    setSignLanguage: (value) => updateSetting("signLanguage", value),
    setFontSize: (value) => updateSetting("fontSize", value),
    setAudioInput: (value) => updateSetting("audioInput", value),
    setLanguage: (value) => updateSetting("language", value),
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

SettingsContext.Provider.propTypes = {
  value: PropTypes.shape({
    subtitles: PropTypes.bool,
    signLanguage: PropTypes.bool,
    fontSize: PropTypes.string,
    audioInput: PropTypes.string,
    language: PropTypes.string,
    availableLanguages: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      })
    ).isRequired,
    updateSetting: PropTypes.func.isRequired,
    setSubtitles: PropTypes.func.isRequired,
    setSignLanguage: PropTypes.func.isRequired,
    setFontSize: PropTypes.func.isRequired,
    setAudioInput: PropTypes.func.isRequired,
    setLanguage: PropTypes.func.isRequired,
  }),
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
