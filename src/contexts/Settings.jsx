// src/contexts/Settings.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      subtitles: false,
      signLanguage: true,
      fontSize: 'Medium',
      audioInput: 'Microphone 1'
    };
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  // Update individual setting
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        updateSetting,
        setSubtitles: (value) => updateSetting('subtitles', value),
        setSignLanguage: (value) => updateSetting('signLanguage', value),
        setFontSize: (value) => updateSetting('fontSize', value),
        setAudioInput: (value) => updateSetting('audioInput', value)
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
