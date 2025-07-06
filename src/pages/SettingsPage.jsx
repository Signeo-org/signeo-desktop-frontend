import React, { useEffect, useState } from "react";
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

  const [devices, setDevices] = useState([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState("");

  // ✅ Load saved selection
  useEffect(() => {
    const savedIndex = localStorage.getItem("selectedDeviceIndex");
    if (savedIndex !== null) {
      setSelectedDeviceIndex(savedIndex);
    }
  }, []);

  // ✅ Set up listener + request device list
  useEffect(() => {
    if (window.electronAPI?.onAudioDeviceList) {
      window.electronAPI.onAudioDeviceList((deviceList) => {
        setDevices(deviceList);

        // ✅ Auto-send previously selected device if available
        const savedIndex = localStorage.getItem("selectedDeviceIndex");
        if (savedIndex !== null && deviceList[+savedIndex]) {
          window.electronAPI?.selectAudioDevice(+savedIndex);
        }
      });

      window.electronAPI.getAudioDevices(); // trigger device list
    }
  }, []);

  const handleDeviceChange = (e) => {
    const index = parseInt(e.target.value);
    setSelectedDeviceIndex(index);
    localStorage.setItem("selectedDeviceIndex", String(index)); // ✅ Save to localStorage
    window.electronAPI?.selectAudioDevice(index); // ✅ Send index to backend
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 transition">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-2xl bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 space-y-6 relative">
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
          <div>
            <label className="block text-gray-600 dark:text-gray-400">
              Audio Input
            </label>
            <select
              value={selectedDeviceIndex}
              onChange={handleDeviceChange}
              className="w-full px-3 py-2 mt-1 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700"
            >
              <option disabled value="">
                Select a device
              </option>
              {devices.map((device, index) => (
                <option key={index} value={index}>
                  {device}
                </option>
              ))}
            </select>
          </div>

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

          <div className="flex items-center justify-between pt-2">
            <label className="text-gray-600 dark:text-gray-400">
              Show Subtitles
            </label>
            <input
              type="checkbox"
              checked={subtitles}
              onChange={() => setSubtitles(!subtitles)}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-gray-600 dark:text-gray-400">
              Show Sign Language
            </label>
            <input
              type="checkbox"
              checked={signLanguage}
              onChange={() => setSignLanguage(!signLanguage)}
              className="w-5 h-5"
            />
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          ← Back to Main
        </button>
      </div>
    </div>
  );
}
