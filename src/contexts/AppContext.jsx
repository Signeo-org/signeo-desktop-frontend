// src/contexts/AppContext.jsx
import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAudioToolRunning, setIsAudioToolRunning] = useState(false);
  const [isFirstExecution, setIsFirstExecution] = useState(true);

  const value = {
    isPlaying,
    setIsPlaying,
    isInitializing,
    setIsInitializing,
    isAudioToolRunning,
    setIsAudioToolRunning,
    isFirstExecution,
    setIsFirstExecution,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
