import axios from "axios";
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
    const fetchTranscription = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/transcription"
        );
        setTranscription(response.data.transcription);
      } catch (error) {
        console.error("Error fetching transcription:", error);
      }
    };

    fetchTranscription();

    const intervalId = setInterval(fetchTranscription, 500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={`flex w-screen h-screen align-middle justify-center ${
        darkMode
          ? "bg-darkTheme-dark1 text-blue-100"
          : "bg-whiteTheme-light1 text-whiteTheme-accent1"
      }`}
    >
      {transcription.length > 0 ? (
        <h1>{transcription}</h1>
      ) : (
        <h1>Loading...</h1>
      )}
    </div>
  );
}

export default SubtitlePage;
