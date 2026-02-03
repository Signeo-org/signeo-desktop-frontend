// src/pages/HomePage.tsx
import { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../App";
import { useApp } from "../contexts/AppContext";
import { useSettings } from "../contexts/SettingsContext";
import { Settings, Square, Mic, Headphones, Languages, Moon, Sun, Database } from "lucide-react";
import signeoLogo from "../assets/icon/signeo-clear.png";

interface AudioDevice {
  index: number;
  name: string;
}

export default function HomePage() {
  const {
    isPlaying,
    setIsPlaying,
    isInitializing,
    setIsInitializing,
    setIsAudioToolRunning,
  } = useApp();
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();
  const { subtitles, signLanguage, language, setLanguage, availableLanguages } = useSettings();

  // Audio Device States
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number | "">("");
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [deviceChosen, setDeviceChosen] = useState(false);

  // Load saved device
  useEffect(() => {
    const savedIndex = localStorage.getItem("selectedDeviceIndex");
    if (savedIndex) {
      setSelectedDeviceIndex(Number(savedIndex));
      setDeviceChosen(true);
    }

    if (window.electronAPI?.onAudioDeviceList) {
      const handleDeviceList = (deviceList: AudioDevice[]) => {
        console.log("[HomePage] Audio devices received:", deviceList);
        setDevices(deviceList);
      };

      window.electronAPI.onAudioDeviceList(handleDeviceList);
      window.electronAPI.getAudioDevices();
    }
  }, []);

  const handleDeviceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const deviceIndex = parseInt(e.target.value);
    setSelectedDeviceIndex(deviceIndex);
    setDeviceChosen(true);
  };

  const handlePlay = async () => {
    if (!deviceChosen || selectedDeviceIndex === "") {
      alert("⚠️ Please choose an audio input device before starting translation.");
      return;
    }

    localStorage.setItem("selectedDeviceIndex", String(selectedDeviceIndex));
    console.log(`[HomePage] Device locked and chosen index ${selectedDeviceIndex}`);

    if (window.electronAPI?.selectAudioDevice && typeof selectedDeviceIndex === "number") {
      window.electronAPI
        .selectAudioDevice(selectedDeviceIndex)
        .then(() => console.log(`[HomePage] Device index ${selectedDeviceIndex} sent to tool.`))
        .catch((err: Error) => console.error("[HomePage] Failed to send device index:", err));
    }
    setIsAudioToolRunning(true);

    if (!isPlaying) {
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
        console.error("[HomePage] Error starting translation:", error);
        alert("Failed to start translation. Check console for details.");
        setIsPlaying(false);
      } finally {
        setIsInitializing(false);
      }
    } else {
      try {
        if (window.electronAPI) {
          await window.electronAPI.closeAuxWindows();
        }
      } catch (error) {
        console.error("[HomePage] Error stopping translation:", error);
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
      {/* Glass container - entrance animation */}
      <div className="relative w-full max-w-lg md:max-w-xl lg:max-w-2xl animate-fade-in-up">
        <div
          className={`relative backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 md:p-12 border transition-all duration-300
            ${darkMode
              ? "bg-slate-800/40 border-slate-700/50 shadow-[20px_20px_60px_#0a0f1a,-20px_-20px_60px_#1e293b]"
              : "bg-white/40 border-white/50 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]"}
          `}
        >
          {/* Theme Toggle */}
          <div className="absolute top-8 right-8">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-4 rounded-2xl transition-all duration-200 group
                ${darkMode
                  ? "bg-[#1e293b] shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#2d3e56] hover:shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56] active:shadow-[inset_3px_3px_6px_#0f172a,inset_-3px_-3px_6px_#2d3e56]"
                  : "bg-[#e0e5ec] shadow-[6px_6px_12px_#c5cad1,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff] active:shadow-[inset_3px_3px_6px_#c5cad1,inset_-3px_-3px_6px_#ffffff]"}
              `}
              aria-label="Toggle theme"
            >
              {!darkMode ? (
                <Moon className="w-5 h-5 text-[#5a6c7d] group-hover:text-[#FDB813] transition-colors duration-300" />
              ) : (
                <Sun className="w-5 h-5 text-[#94a3b8] group-hover:text-[#FDB813] transition-colors duration-300" />
              )}
            </button>
          </div>

          {/* Settings Link */}
          <div className="absolute top-8 left-8 flex gap-4 z-50">
            <button
              onClick={() => navigate("/admin")}
              className={`p-3 rounded-2xl transition-all duration-200 group
                ${darkMode
                  ? "bg-[#1e293b] shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#2d3e56] hover:shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56] text-slate-400 hover:text-[#FDB813]"
                  : "bg-[#e0e5ec] shadow-[6px_6px_12px_#c5cad1,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff] text-slate-600 hover:text-[#FDB813]"}
              `}
              title="Admin Dashboard"
            >
              <Database className="w-5 h-5 transition-colors" />
            </button>
            <button
              onClick={() => navigate("/settings")}
              className={`p-3 rounded-2xl transition-all duration-200 group
                ${darkMode
                  ? "bg-[#1e293b] shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#2d3e56] hover:shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56] text-slate-400 hover:text-[#FDB813]"
                  : "bg-[#e0e5ec] shadow-[6px_6px_12px_#c5cad1,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff] text-slate-600 hover:text-[#FDB813]"}
              `}
              title="Settings"
            >
              <Settings className="w-5 h-5 hover:rotate-90 transition-all duration-300" />
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6 md:mb-8 animate-fade-in-up [animation-delay:100ms] opacity-0 fill-mode-forwards">
            <img
              src={signeoLogo}
              alt="Signeo Logo"
              className="mx-auto w-28 sm:w-32 md:w-40 lg:w-48 h-auto hover:scale-105 transition-transform duration-300 drop-shadow-md"
            />
          </div>

          {/* Controls */}
          <div className="space-y-6 animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards">
            {/* Audio device */}
            <div>
              <label
                className={`flex items-center gap-2 text-sm font-semibold mb-2 transition-colors duration-300 ${darkMode ? "text-slate-100" : "text-[#2c3e50]"
                  }`}
              >
                <Headphones className="w-4 h-4 text-[#FDB813]" />
                Audio Device
              </label>
              <select
                value={selectedDeviceIndex}
                onChange={handleDeviceChange}
                disabled={deviceLocked}
                className={`w-full rounded-xl px-4 py-3 cursor-pointer
                  transition-all duration-200 outline-none border
                  focus:ring-2 focus:ring-[#FDB813]/50
                  ${darkMode
                    ? "bg-slate-900/40 border-slate-700 text-slate-200"
                    : "bg-white/60 border-white/70 text-[#2c3e50]"}
                  ${deviceLocked && "opacity-50 cursor-not-allowed"}
                `}
              >
                <option disabled value="">
                  {deviceLocked ? "Device Locked" : "Select device..."}
                </option>
                {devices.map((device) => (
                  <option key={device.index} value={device.index}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label
                className={`flex items-center gap-2 text-sm font-semibold mb-2 transition-colors duration-300 ${darkMode ? "text-slate-100" : "text-[#2c3e50]"
                  }`}
              >
                <Languages className="w-4 h-4 text-[#FDB813]" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 cursor-pointer
                  transition-all duration-200 outline-none border
                  focus:ring-2 focus:ring-[#FDB813]/50
                  ${darkMode
                    ? "bg-slate-900/40 border-slate-700 text-slate-200"
                    : "bg-white/60 border-white/70 text-[#2c3e50]"}
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
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                ${isPlaying
                  ? "bg-linear-to-br from-[#ef4444] to-[#dc2626] text-white shadow-[8px_8px_20px_#be3c3c,-8px_-8px_20px_#ff5252]"
                  : "bg-linear-to-br from-[#FDB813] to-[#F4A320] text-black shadow-[8px_8px_20px_#d99a10,-8px_-8px_20px_#ffd020]"}
              `}
            >
              {/* Neumorphic inner glow */}
              <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-white/20 to-transparent opacity-50 pointer-events-none" />

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
                  <div className="absolute inset-0 rounded-3xl bg-red-400/30 blur-xl" />
                </div>
              )}
            </button>

            {/* Live indicator */}
            {isPlaying && (
              <div className="flex items-center justify-center gap-2 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <span className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-[#5a6c7d]"}`}>
                  Live Transcription Active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
