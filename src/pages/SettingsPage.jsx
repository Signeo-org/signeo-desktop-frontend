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

  const toggleWindow = async (windowType) => {
    if (window.electronAPI) {
      if (windowType === 'sign') {
        await window.electronAPI.toggleSignWindow(!signLanguage);
        setSignLanguage(!signLanguage);
      } else if (windowType === 'subtitle') {
        await window.electronAPI.toggleSubtitleWindow(!subtitles);
        setSubtitles(!subtitles);
      }
    }
  };

  const [devices, setDevices] = useState([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState("");

  // ✅ Load saved selection
  useEffect(() => {
    const savedIndex = localStorage.getItem("selectedDeviceIndex");
    if (savedIndex !== null) {
      setSelectedDeviceIndex(savedIndex);
    }
  }, []);

  // Load devices when the dropdown is clicked
  const handleDropdownClick = () => {
    if (devices.length === 0 && window.electronAPI?.onAudioDeviceList) {
      const handleDeviceList = (deviceList) => {
        setDevices(deviceList);
        // Remove the event listener after we get the devices
        window.electronAPI.offAudioDeviceList(handleDeviceList);
      };

      window.electronAPI.onAudioDeviceList(handleDeviceList);
      window.electronAPI.getAudioDevices();
    }
  };

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
              onClick={handleDropdownClick}
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
            <button
              onClick={() => toggleWindow('subtitle')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${subtitles ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span
                className={`${subtitles ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-gray-600 dark:text-gray-400">
              Show Sign Language
            </label>
            <button
              onClick={() => toggleWindow('sign')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${signLanguage ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span
                className={`${signLanguage ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
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
