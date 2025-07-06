import React, { useEffect, useState, useRef } from "react";

function SubtitlePage() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  const [lines, setLines] = useState([]);
  const buffer = useRef("");

  useEffect(() => {
    const handleText = (data) => {
      console.log("📥 Raw data received:", data);
      buffer.current += data;

      const all = buffer.current.split(/\r?\n/);
      buffer.current = all.pop(); // keep incomplete line

      const cleanedLines = all
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^\[Transcription\]\s*/, "").trim());

      for (const line of cleanedLines) {
        console.log("📤 Dispatching subtitle:", line);
        window.dispatchEvent(new CustomEvent("subtitle-update", { detail: line }));
      }

      if (cleanedLines.length > 0) {
        setLines((prev) => {
          const combined = [...prev, ...cleanedLines];
          const deduped = combined.filter(
            (line, i, arr) => i === 0 || line !== arr[i - 1]
          );
          return deduped.slice(-2);
        });
      }
    };

    if (window.electronAPI?.onTranscriptionOutput) {
      window.electronAPI.onTranscriptionOutput(handleText);
    }

    return () => {};
  }, []);

  return (
    <div
      className={`flex w-screen h-screen align-middle justify-center items-center text-center text-3xl font-semibold px-4 ${
        darkMode
          ? "bg-darkTheme-dark1 text-blue-100"
          : "bg-whiteTheme-light1 text-whiteTheme-accent1"
      }`}
    >
      <div>
        {lines.length > 0 ? (
          lines.map((line, idx) => <div key={idx}>{line}</div>)
        ) : (
          <h1>No text received yet</h1>
        )}
      </div>
    </div>
  );
}

export default SubtitlePage;