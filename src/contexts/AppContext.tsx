// src/contexts/AppContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  isInitializing: boolean;
  setIsInitializing: (value: boolean) => void;
  isAudioToolRunning: boolean;
  setIsAudioToolRunning: (value: boolean) => void;
  isFirstExecution: boolean;
  setIsFirstExecution: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAudioToolRunning, setIsAudioToolRunning] = useState(false);
  const [isFirstExecution, setIsFirstExecution] = useState(true);

  const value: AppContextType = {
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
