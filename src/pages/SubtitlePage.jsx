// SubtitlePage.jsx
import React, { useEffect, useState } from "react";

function SubtitlePage() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode) {
      try {
        return JSON.parse(savedDarkMode);
      } catch (e) {
        console.error("Error parsing darkMode from localStorage", e);
      }
    }
    return false;
  });

  const [transcription, setTranscription] = useState("");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");

    ws.onmessage = (event) => {
      setTranscription(event.data);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div
      className={`flex w-screen h-screen align-middle justify-center ${
        darkMode
          ? "bg-darkTheme-dark1 text-blue-100"
          : "bg-whiteTheme-light1 text-whiteTheme-accent1"
      }`}
    >
      <h1>{transcription}</h1>
    </div>
  );
}

export default SubtitlePage;
