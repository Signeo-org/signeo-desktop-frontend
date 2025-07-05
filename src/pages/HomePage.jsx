// MainPage.jsx (JS version – no TypeScript keywords)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../App";
import { useSettings } from "../contexts/SettingsContext";

export default function MainPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();
  const { subtitles, signLanguage, language, setLanguage, availableLanguages } =
    useSettings();

  const handlePlay = async () => {
  if (!isPlaying) {
    if (!subtitles && !signLanguage) {
      alert(
        "Both subtitles and sign language are disabled in settings. Please enable at least one in Settings."
      );
      return;
    }

    setIsPlaying(true);

    if (window.electronAPI) {
      try {
        // Start AudioTranscriptionTool.exe via backend API
        const startResponse = await fetch("http://localhost:5000/start", {
          method: "POST",
        });
        if (!startResponse.ok) {
          throw new Error("Failed to start audio tool on server");
        }

        // Close any existing auxiliary windows first
        await window.electronAPI.closeAuxWindows();

        // Open the enabled windows
        if (subtitles) {
          await window.electronAPI.openWindow("subtitle");
        }
        if (signLanguage) {
          await window.electronAPI.openWindow("sign");
        }
      } catch (error) {
        console.error("Error managing playback:", error);
        alert(
          "Failed to start audio tool or open windows. Check server and Electron logs."
        );
        setIsPlaying(false);
      }
    } else {
      alert("Auxiliary windows unavailable outside the Electron shell.");
      setIsPlaying(false);
    }
  } else {
    setIsPlaying(false);
    if (window.electronAPI) {
      try {
        // Stop the tool via API
        await fetch("http://localhost:5000/stop", { method: "POST" });
        await window.electronAPI.closeAuxWindows();
      } catch (error) {
        console.error("Error closing windows or stopping tool:", error);
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
          className={`w-full px-4 py-2 text-lg font-medium rounded-lg text-white transition-all transform ${
            isPlaying
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isPlaying ? "⏹ Stop Translation" : "▶ Start Translation"}
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