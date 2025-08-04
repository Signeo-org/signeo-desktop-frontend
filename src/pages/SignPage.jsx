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

  useEffect(() => {
    if (window.electronAPI?.onTranscriptionOutput) {
      console.log("[0]: onTranscriptionOutput subscribed");

      window.electronAPI.onTranscriptionOutput((text) => {
        console.log("[0]: Received transcription:", text);

        // ✅ Ignore any text that is only between [] or () (like [BLANK_AUDIO], (crickets chirping), etc.)
        if (/^\s*(\[[^\]]*\]|\([^\)]*\))\s*$/i.test(text.trim())) {
          console.log("[0]: Ignored segment because it contains only bracketed/parenthesized content:", text);
          return;
        }

        // Clean the text and split into words
        const cleanedText = text.replace(/\[.*?\]/g, "").toLowerCase();
        const words = cleanedText.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
        if (words.length === 0) return;

        let newWords;

        // ✅ If transcript resets (new sentence), add all words to the queue
        if (!cleanedText.startsWith(lastTranscriptRef.current)) {
          console.log("[0]: Transcript reset detected → adding entire new sentence");
          newWords = words;
          lastIndexRef.current = 0; // restart incremental tracking
        } else {
          // ✅ Otherwise, add only new words
          newWords = words.slice(lastIndexRef.current);
        }

        // Update tracking for next chunk
        lastTranscriptRef.current = cleanedText;
        lastIndexRef.current = words.length;

        // Create queue entries
        const newEntries = newWords.map((word) => ({
          word,
          path: `../../resources/SL/${word}/shortest.mp4`,
        }));

        // Append to queue
        wordQueueRef.current.push(...newEntries);

        // Start playback if not already running
        if (!isPlayingRef.current) {
          startPlaybackLoop();
        }
      });
    }

    // ✅ Clear queue & reset when window is closed
    const handleUnload = () => {
      console.log("[0]: Window closing → clearing word queue and resetting state");
      wordQueueRef.current = [];
      isPlayingRef.current = false;
      lastIndexRef.current = 0;
      lastTranscriptRef.current = "";
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // ✅ Playback loop that processes words one by one
  const startPlaybackLoop = async () => {
    isPlayingRef.current = true;

    while (wordQueueRef.current.length > 0) {
      // Take the first word in the queue
      const { word, path } = wordQueueRef.current[0];
      setCurrentWord(word);
      console.log("[0]: Playing:", word, "→", path);

      const videoExists = await checkVideoExists(path);

      if (videoExists) {
        // Play the video and wait for it to finish
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
            console.warn(`[0] [WARNING]: Could not load video for: ${word}`);
            cleanup();
            resolve();
          };

          const handleCanPlay = () => {
            video.removeEventListener("canplay", handleCanPlay);
            video.playbackRate = 2;
            video.play().catch((err) => {
              console.error("[0] [ERROR]: Playback error:", err);
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
      } else {
        console.warn(`[0] [WARNING]: Skipping missing/invalid video for: ${word}`);
      }

      // ✅ Remove the processed word (shown or skipped)
      wordQueueRef.current.shift();
    }

    setCurrentWord("");
    isPlayingRef.current = false;
  };

  // ✅ Check if the video file exists
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
