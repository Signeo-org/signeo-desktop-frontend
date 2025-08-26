// src/contexts/AppContext.jsx
import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAudioToolRunning, setIsAudioToolRunning] = useState(false);

  const value = {
    isPlaying,
    setIsPlaying,
    isInitializing,
    setIsInitializing,
    isAudioToolRunning,
    setIsAudioToolRunning,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
