import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../App";

function SignPage() {
  const { darkMode } = useTheme();
  const [currentWord, setCurrentWord] = useState("");

  const videoRef = useRef(null);
  const wordQueueRef = useRef([]);
  const playedWordsRef = useRef(new Set());
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (window.electronAPI?.onTranscriptionOutput) {
      console.log("🧠 onTranscriptionOutput subscribed");

      window.electronAPI.onTranscriptionOutput((text) => {
        console.log("📝 Received transcription:", text);

        const words = text
          .replace(/\[.*?\]/g, "")
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter(Boolean);

        if (words.length === 0) return;

        const newEntries = words
          .filter((word) => !playedWordsRef.current.has(word))
          .map((word) => ({
            word,
            path: `../../resources/SL/${word}/shortest.mp4`,
          }));

        wordQueueRef.current.push(...newEntries);

        if (!isPlayingRef.current) {
          startPlaybackLoop();
        }
      });
    }
  }, []);

  const startPlaybackLoop = async () => {
    isPlayingRef.current = true;

    while (wordQueueRef.current.length > 0) {
      const { word, path } = wordQueueRef.current.shift();
      playedWordsRef.current.add(word);
      setCurrentWord(word);

      console.log("📼 Playing:", word, "→", path);

      const videoExists = await checkVideoExists(path);
      if (!videoExists) {
        console.warn(`⚠️ Skipping missing/invalid video for: ${word}`);
        continue;
      }

      await new Promise((resolve) => {
        const video = videoRef.current;
        if (!video) return resolve();

        const cleanup = () => {
          video.removeEventListener("ended", handleEnded);
          video.removeEventListener("error", handleError);
          video.removeEventListener("canplay", handleCanPlay);
        };

        const handleEnded = () => {
          cleanup();
          resolve();
        };

        const handleError = () => {
          console.warn(`⚠️ Could not load video for: ${word}`);
          cleanup();
          resolve();
        };

        const handleCanPlay = () => {
          video.removeEventListener("canplay", handleCanPlay);
          video.playbackRate = 1.5;
          video.play().catch((err) => {
            console.error("❌ Playback error:", err);
            cleanup();
            resolve();
          });
        };

        video.addEventListener("ended", handleEnded);
        video.addEventListener("error", handleError);
        video.addEventListener("canplay", handleCanPlay);
        video.src = path;
        video.load();
      });
    }

    setCurrentWord("");
    isPlayingRef.current = false;
  };

  const checkVideoExists = async (path) => {
    try {
      const response = await fetch(path, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center h-screen ${
        darkMode
          ? "bg-darkTheme-dark1 text-blue-100"
          : "bg-whiteTheme-light1 text-whiteTheme-accent1"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ maxHeight: "80vh", maxWidth: "90vw", visibility: currentWord ? "visible" : "hidden" }}
      />
      {!currentWord && <h1 className="mt-4">Waiting for signs...</h1>}
    </div>
  );
}

export default SignPage;
