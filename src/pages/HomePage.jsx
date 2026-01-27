import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../App";
import { useApp } from "../contexts/AppContext";
import { useSettings } from "../contexts/SettingsContext";
import { Settings, Square, Mic, Headphones, Languages, Moon, Sun } from 'lucide-react';

export default function MainPage() {
  const { isPlaying, setIsPlaying, isInitializing, setIsInitializing, isAudioToolRunning, setIsAudioToolRunning, isFirstExecution, setIsFirstExecution } = useApp();
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();
  const { subtitles, signLanguage, language, setLanguage, availableLanguages } = useSettings();

  // ✅ Audio Device States
  const [devices, setDevices] = useState([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState("");
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [deviceChosen, setDeviceChosen] = useState(false); // track if user selected a device

  // ✅ Load saved device
  useEffect(() => {
    const savedIndex = localStorage.getItem("selectedDeviceIndex");
    if (savedIndex) {
      setSelectedDeviceIndex(savedIndex);
      setDeviceChosen(true);
    }

    // ✅ Request device list on mount
    if (window.electronAPI?.onAudioDeviceList) {
      const handleDeviceList = (deviceList) => {
        console.log("[MainPage] Audio devices received:", deviceList);
        setDevices(deviceList);
      };

      window.electronAPI.onAudioDeviceList(handleDeviceList);
      window.electronAPI.getAudioDevices();
    }
  }, []);

  const handleDeviceChange = (e) => {
    const index = parseInt(e.target.value);
    setSelectedDeviceIndex(index);
    setDeviceChosen(true);
  };

  // ✅ Play Button Logic
  const handlePlay = async () => {
    // ❌ Prevent play if no device selected
    if (!deviceChosen || selectedDeviceIndex === "") {
      alert("⚠️ Please choose an audio input device before starting translation.");
      return;
    }

    localStorage.setItem("selectedDeviceIndex", String(selectedDeviceIndex));
    console.log(`[MainPage] Device locked and chosen index ${selectedDeviceIndex}`);

    if (window.electronAPI?.selectAudioDevice && devices[selectedDeviceIndex]) {
      // Use actual device index from device object, not array position
      const actualDeviceIndex = devices[selectedDeviceIndex].index;
      window.electronAPI
        .selectAudioDevice(actualDeviceIndex)
        .then(() => console.log(`[MainPage] Device index ${actualDeviceIndex} sent to tool.`))
        .catch((err) => console.error("[MainPage] Failed to send device index:", err));
    }
    setIsAudioToolRunning(true);

    if (!isPlaying) {
      // Start translation
      setIsInitializing(true);
      try {
        if (window.electronAPI) {
          if (subtitles) await window.electronAPI.openWindow("subtitle");
          if (signLanguage) await window.electronAPI.openWindow("sign");
          setIsPlaying(true);
        } else {
          alert("Auxiliary windows unavailable outside Electron.");
        }
      } catch (error) {
        console.error("[0] [ERROR]: Error starting translation:", error);
        alert("Failed to start translation. Check console for details.");
        setIsPlaying(false);
      } finally {
        setIsInitializing(false);
      }
    } else {
      // Stop translation
      try {
        if (window.electronAPI) {
          await window.electronAPI.closeAuxWindows();
          //await window.electronAPI.stopAudioTool();
        }
      } catch (error) {
        console.error("[0] [ERROR]: Error stopping translation:", error);
      } finally {
        setIsPlaying(false);
      }
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
        ${darkMode
          ? "bg-linear-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]"
          : "bg-linear-to-br from-[#e0e5ec] via-[#e8ecf0] to-[#d5dce3]"}
      `}
    >
      {/* Glass container */}
      <div className="relative w-full max-w-lg">
        <div
          className={`backdrop-blur-2xl rounded-[2.5rem] p-12 border transition-all duration-300
            ${darkMode
              ? "bg-slate-800/40 border-slate-700/50 shadow-[20px_20px_60px_#0a0f1a,-20px_-20px_60px_#1e293b]"
              : "bg-white/40 border-white/50 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]"}
          `}
        >
          <div className="absolute top-8 right-8">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-4 rounded-2xl transition-all duration-200 group
                ${darkMode
                  ? 'bg-[#1e293b] shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#2d3e56] hover:shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56] active:shadow-[inset_3px_3px_6px_#0f172a,inset_-3px_-3px_6px_#2d3e56]'
                  : 'bg-[#e0e5ec] shadow-[6px_6px_12px_#c5cad1,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff] active:shadow-[inset_3px_3px_6px_#c5cad1,inset_-3px_-3px_6px_#ffffff]'}
                }`}
              aria-label="Toggle theme"
            >
              {darkMode === 'light' ? (
                <Moon className="w-5 h-5 text-[#5a6c7d] group-hover:text-[#6366f1] transition-colors duration-300" />
              ) : (
                <Sun className="w-5 h-5 text-[#94a3b8] group-hover:text-[#fbbf24] transition-colors duration-300" />
              )}
            </button>
          </div>
          
          {/* Settings */}
          <button
            onClick={() => navigate("/settings")}
            className="block w-full text-center text-sm text-slate-400 hover:text-[#FDB813] transition"
          >
            <Settings className={`w-5 h-5 group-hover:rotate-90 transition-all duration-300 ${
              darkMode 
                ? 'text-[#94a3b8] group-hover:text-[#FDB813]' 
                : 'text-[#5a6c7d] group-hover:text-[#FDB813]'
            }`} />
          </button>

          {/* Header */}
          <div className="text-center mb-10">
            <div
              className={`mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br
                ${darkMode
                  ? "from-slate-700 to-[#1e293b] shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#2d3e56]"
                  : "from-white to-[#e0e5ec] shadow-[8px_8px_16px_#c5cad1,-8px_-8px_16px_#ffffff]"}
              `}
            >
              <span className="text-3xl text-[#FDB813]">🎤</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Signeo
            </h1>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Audio device */}
            <div>
              <label className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-300 ${
                darkMode ? 'text-slate-100' : 'text-[#2c3e50]'
              }`}>
                <Headphones className="w-4 h-4 text-[#FDB813]" />
                Audio Device
              </label>
              <select
                value={selectedDeviceIndex}
                onChange={handleDeviceChange}
                disabled={deviceLocked}
                className={`mt-2 w-full rounded-xl px-4 py-3 backdrop-blur border transition
                  ${darkMode
                    ? "bg-slate-900/40 border-slate-700 text-slate-200"
                    : "bg-white/60 border-white/70"}
                  ${deviceLocked && "opacity-50 cursor-not-allowed"}
                `}
              >
                <option disabled value="">
                  {deviceLocked ? "Device Locked" : "Select device"}
                </option>
                {devices.map((device, index) => (
                  <option key={index} value={index}>
                    {device}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-300 ${
                darkMode ? 'text-slate-100' : 'text-[#2c3e50]'
              }`}>
                <Languages className="w-4 h-4 text-[#FDB813]" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`mt-2 w-full rounded-xl px-4 py-3 backdrop-blur border transition
                  ${darkMode
                    ? "bg-slate-900/40 border-slate-700 text-slate-200"
                    : "bg-white/60 border-white/70"}
                `}
              >
                {availableLanguages?.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action button */}
            <button
              onClick={handlePlay}
              disabled={isInitializing || !deviceChosen}
              className={`
                group relative w-full py-6 px-8 rounded-3xl font-semibold text-lg
                transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                ${isPlaying 
                  ? 'bg-linear-to-br from-[#ef4444] to-[#dc2626] text-white shadow-[8px_8px_20px_#be3c3c,-8px_-8px_20px_#ff5252]' 
                  : 'bg-linear-to-br from-[#FDB813] to-[#F4A320] text-black shadow-[8px_8px_20px_#d99a10,-8px_-8px_20px_#ffd020]'
                }
              `}
            >
              {/* Neumorphic inner glow */}
              <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-white/20 to-transparent opacity-50 pointer-events-none"></div>
              
              {/* Button Content */}
              <div className="relative flex items-center justify-center gap-3">
                {isPlaying ? (
                  <>
                    <Square className="w-6 h-6 fill-current" />
                    <span>Stop Transcription</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    <span>Start Transcription</span>
                  </>
                )}
              </div>

              {/* Pulsing Ring for Active State */}
              {isPlaying && (
                <div className="absolute inset-0 rounded-3xl animate-pulse">
                  <div className="absolute inset-0 rounded-3xl bg-red-400/30 blur-xl"></div>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
