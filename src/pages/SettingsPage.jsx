import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../App";
import { useSettings } from "../contexts/SettingsContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();
  const {
    fontSize,
    signLanguage,
    subtitles,
    setFontSize,
    setSignLanguage,
    setSubtitles,
  } = useSettings();

  // ✅ Define missing toggleWindow function
  const toggleWindow = (type) => {
    if (type === "subtitle") {
      setSubtitles(!subtitles);
    } else if (type === "sign") {
      setSignLanguage(!signLanguage);
    }
  };

  // ✅ Define missing handleExitSettings
  const handleExitSettings = () => {
    navigate("/"); // just navigate back to main
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 transition">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-2xl bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 space-y-6 relative">
        {/* Dark Mode Toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm text-gray-400 hover:text-blue-500"
          >
            {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        <h2 className="text-2xl font-semibold text-center pt-2">Settings</h2>

        <div className="space-y-4 text-sm">
          {/* Font Size */}
          <div>
            <label className="block text-gray-600 dark:text-gray-400">
              Subtitles Font Size
            </label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full px-3 py-2 mt-1 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700"
            >
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
            </select>
          </div>

          {/* Subtitles Toggle */}
          <div className="flex items-center justify-between pt-2">
            <label className="text-gray-600 dark:text-gray-400">Show Subtitles</label>
            <button
              onClick={() => toggleWindow("subtitle")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                subtitles ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`${subtitles ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>

          {/* Sign Language Toggle */}
          <div className="flex items-center justify-between pt-2">
            <label className="text-gray-600 dark:text-gray-400">Show Sign Language</label>
            <button
              onClick={() => toggleWindow("sign")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                signLanguage ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`${signLanguage ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={handleExitSettings}
          className="mt-6 w-full text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          ← Back to Main
        </button>
      </div>
    </div>
  );
}
