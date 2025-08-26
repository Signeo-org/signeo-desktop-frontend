import React, { useEffect, useState, useRef } from "react";
import { useSettings } from "../contexts/SettingsContext";

function SubtitlePage() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  const [lines, setLines] = useState([]);
  const measureRef = useRef(null);

  // ✅ get fontSize from settings
  const { fontSize } = useSettings();

  // Map fontSize setting to Tailwind classes (or inline style)
  const fontSizeClass = {
    Small: "text-xl",
    Medium: "text-3xl",
    Large: "text-5xl",
  }[fontSize] || "text-3xl";

  useEffect(() => {
    const handleText = (raw) => {
      const cleaned = raw
        .trim()
        .replace(/^\[1\]:\s*/, "")
        .replace(/^\[Transcription\]\s*/, "")
        .replace(/\[[^\]]*\]|\([^\)]*\)/g, "")
        .trim();
      if (!cleaned) return;

      setLines((prev) => {
        const combined = [...prev, cleaned];
        const deduped = combined.filter(
          (line, i, arr) => i === 0 || line !== arr[i - 1]
        );
        return deduped.slice(-2); // keep last 2 lines
      });
    };

    window.electronAPI?.onTranscriptionOutput?.(handleText);
  }, []);

  useEffect(() => {
    if (measureRef.current && window.electronAPI?.reportSubtitleSize) {
      const { offsetWidth: width, offsetHeight: height } = measureRef.current;
      window.electronAPI.reportSubtitleSize({ width, height });
    }
  }, [lines, fontSize]); // ✅ recalc when fontSize changes

  return (
    <div
      ref={measureRef}
      className={`flex flex-col w-auto h-auto items-center justify-center text-center font-semibold px-4 ${fontSizeClass} ${
        darkMode ? "text-white" : "text-white"
      }`}
    >
      {lines.length > 0 ? (
        lines.map((line, idx) => <div key={idx}>{line}</div>)
      ) : (
        <h1>No text received yet</h1>
      )}
    </div>
  );
}

export default SubtitlePage;
