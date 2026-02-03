// src/contexts/AppContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface AppContextType {
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  isInitializing: boolean;
  setIsInitializing: (value: boolean) => void;
  isAudioToolRunning: boolean;
  setIsAudioToolRunning: (value: boolean) => void;
  isFirstExecution: boolean;
  setIsFirstExecution: (value: boolean) => void;
  transcriptHistory: string[];
  partialTranscript: string;
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
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const [partialTranscript, setPartialTranscript] = useState("");

  // Capture transcript for admin history
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleTranscript = (data: { text: string; type: "partial" | "final" }) => {
      const text = data.text.trim();
      if (!text) return;

      if (data.type === "partial") {
        setPartialTranscript(text);
      } else if (data.type === "final") {
        setTranscriptHistory(prev => {
          const last = prev[prev.length - 1];
          // Prevent duplicates if the new text is identical to the last one
          if (last === text) {
            return prev;
          }
          return [...prev, text];
        });
        setPartialTranscript(""); // Clear partial once finalized
      }
    };

    window.electronAPI.onTranscriptionOutput(handleTranscript);

    // Cleanup if necessary (though we want this persistent generally)
    return () => { };
  }, []);

  const value: AppContextType = {
    isPlaying,
    setIsPlaying,
    isInitializing,
    setIsInitializing,
    isAudioToolRunning,
    setIsAudioToolRunning,
    isFirstExecution,
    setIsFirstExecution,
    transcriptHistory,
    partialTranscript,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
