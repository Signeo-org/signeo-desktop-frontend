// MainPage.jsx (JS version – no TypeScript keywords)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../App";
import { useSettings } from "../contexts/SettingsContext";

export default function MainPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();
  const { subtitles, signLanguage, language, setLanguage, availableLanguages } =
    useSettings();

  const handlePlay = async () => {
    if (!isPlaying) {
      // Check if any windows should be opened
      if (!subtitles && !signLanguage) {
        alert(
          "Both subtitles and sign language are disabled in settings. Please enable at least one in Settings."
        );
        return; // Exit early without changing play state
      }

      // Start translation
      setIsInitializing(true);
      
      try {
        // runtime check so we don't crash in the browser
        if (window.electronAPI) {
          try {
            // Close any existing windows first
            await window.electronAPI.closeAuxWindows();

            // Open the enabled windows
            if (subtitles) {
              await window.electronAPI.openWindow("subtitle");
            }
            if (signLanguage) {
              await window.electronAPI.openWindow("sign");
            }
            
            // Only set playing to true if everything succeeded
            setIsPlaying(true);
          } catch (error) {
            console.error("Error managing windows:", error);
            alert(
              "Failed to manage auxiliary windows. Please check the console for details."
            );
          }
        } else {
          alert("Auxiliary windows unavailable outside the Electron shell.");
        }
      } finally {
        // Always set initializing to false when done
        setIsInitializing(false);
      }
    } else {
      // Stop translation
      setIsPlaying(false);
      if (window.electronAPI) {
        try {
          await window.electronAPI.closeAuxWindows();
        } catch (error) {
          console.error("Error closing windows:", error);
        }
      }
    }
  };

  React.useEffect(() => {
    return () => window.electronAPI?.closeAuxWindows();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 transition duration-300">
      {/* Card ------------------------------------------------------------ */}
      <div className="w-full max-w-md p-8 pt-12 rounded-2xl shadow-2xl bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 relative space-y-6">
        {/* Dark-mode toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm text-gray-400 hover:text-blue-500"
          >
            {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
        <h1 className="text-4xl font-bold text-center">Audio Interpreter</h1>

        {/* Language selector ------------------------------------------- */}
        <div className="space-y-2">
          <label
            htmlFor="language"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Choose Language
          </label>
          <select
            id="language"
            value={language || "en-US"}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-lg"
          >
            {availableLanguages?.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start button -------------------------------------------------- */}
        <button
          onClick={handlePlay}
          disabled={isInitializing}
          className={`w-full px-4 py-2 text-lg font-medium rounded-lg text-white transition-all transform flex items-center justify-center gap-2 ${
            isPlaying
              ? "bg-red-600 hover:bg-red-700"
              : isInitializing 
                ? "bg-blue-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isInitializing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Initializing...
            </>
          ) : isPlaying ? (
            "⏹ Stop Translation"
          ) : (
            "▶ Start Translation"
          )}
        </button>

        {/* Settings link ------------------------------------------------- */}
        <button
          onClick={() => navigate("/settings")}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 w-full text-center"
        >
          ⚙ Settings
        </button>
      </div>
    </div>
  );
}
