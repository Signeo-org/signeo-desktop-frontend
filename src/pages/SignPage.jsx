import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../App";

function SignPage() {
  const { darkMode } = useTheme();
  const [currentWord, setCurrentWord] = useState("");

  const videoRef = useRef(null);
  const wordQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  const lastIndexRef = useRef(0);
  const lastTranscriptRef = useRef("");

  const lastShownWordRef = useRef(""); // last word that successfully played
  const repeatCountRef = useRef(1);    // count for repeated words after skips

  useEffect(() => {
    if (window.electronAPI?.onTranscriptionOutput) {
      console.log("[0]: onTranscriptionOutput subscribed");

      window.electronAPI.onTranscriptionOutput((text) => {
        console.log("[0]: Received transcription:", text);

        // Ignore segments that are only brackets/parentheses
        if (/^\s*(\[[^\]]*\]|\([^\)]*\))\s*$/i.test(text.trim())) {
          console.log("[0]: Ignored segment:", text);
          return;
        }

        const cleanedText = text.replace(/\[.*?\]/g, "").toLowerCase();
        const words = cleanedText.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
        if (words.length === 0) return;

        let newWords;
        if (!cleanedText.startsWith(lastTranscriptRef.current)) {
          console.log("[0]: Transcript reset detected → adding new sentence");
          newWords = words;
          lastIndexRef.current = 0;
        } else {
          newWords = words.slice(lastIndexRef.current);
        }

        lastTranscriptRef.current = cleanedText;
        lastIndexRef.current = words.length;

        // Build newEntries with async getSignVideoPath
        Promise.all(
          newWords.map(async (word) => ({
            word,
            path: await window.electronAPI.getSignVideoPath(word),
          }))
        ).then((entries) => {
          wordQueueRef.current.push(...entries);
          if (!isPlayingRef.current) {
            startPlaybackLoop();
          }
        });
      });
    }

    const handleUnload = () => {
      console.log("[0]: Window closing → clearing word queue and resetting state");
      wordQueueRef.current = [];
      isPlayingRef.current = false;
      lastIndexRef.current = 0;
      lastTranscriptRef.current = "";
      lastShownWordRef.current = "";
      repeatCountRef.current = 1;
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const startPlaybackLoop = async () => {
    isPlayingRef.current = true;

    while (wordQueueRef.current.length > 0) {
      const { word, path } = wordQueueRef.current[0];

      const videoExists = await checkVideoExists(path);

      if (videoExists) {
        // Handle repeated word after skipped words
        if (word === lastShownWordRef.current) {
          repeatCountRef.current += 1;
        } else {
          repeatCountRef.current = 1;
        }

        lastShownWordRef.current = word;

        setCurrentWord(
          repeatCountRef.current > 1
            ? `${word} (${repeatCountRef.current})`
            : word
        );

        console.log("[0]: Playing:", word, "→", path);

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
            setCurrentWord(""); // hide text when video finishes
            resolve();
          };

          const handleError = () => {
            console.warn(`[0] [WARNING]: Could not load video for: ${word}`);
            cleanup();
            setCurrentWord(""); // ensure text is hidden on error too
            resolve();
          };

          const handleCanPlay = () => {
            video.removeEventListener("canplay", handleCanPlay);
            video.playbackRate = 2;
            video.play().catch((err) => {
              console.error("[0] [ERROR]: Playback error:", err);
              cleanup();
              setCurrentWord("");
              resolve();
            });

            // Show text exactly when video starts
            setCurrentWord(
              repeatCountRef.current > 1
                ? `${word} (${repeatCountRef.current})`
                : word
            );
          };

          video.addEventListener("ended", handleEnded);
          video.addEventListener("error", handleError);
          video.addEventListener("canplay", handleCanPlay);
          video.src = path;
          video.load();
        });
      } else {
        console.warn(`[0] [WARNING]: Skipping missing/invalid video for: ${word}`);
        // Do not reset lastShownWordRef so repeated words after skips are counted
      }

      wordQueueRef.current.shift();
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
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          maxHeight: "80vh",
          maxWidth: "90vw",
          visibility: currentWord ? "visible" : "hidden",
        }}
      />

      {currentWord ? (
        <h2 className="mt-4 text-2xl font-bold">Showing: {currentWord}</h2>
      ) : (
        <h1 className="mt-4">Waiting for signs...</h1>
      )}
    </div>
  );
}

export default SignPage;
