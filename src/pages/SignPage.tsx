// src/pages/SignPage.tsx
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../App";

interface WordEntry {
  word: string;
  path: string;
}

interface PreloadedEntry extends WordEntry {
  element: HTMLVideoElement;
}

function SignPage() {
  const { darkMode } = useTheme();
  const [currentWord, setCurrentWord] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const wordQueueRef = useRef<WordEntry[]>([]);
  const isPlayingRef = useRef(false);

  const lastIndexRef = useRef(0);
  const lastTranscriptRef = useRef("");

  const lastShownWordRef = useRef("");
  const repeatCountRef = useRef(1);

  const preloadedRef = useRef<PreloadedEntry[]>([]);

  useEffect(() => {
    if (window.electronAPI?.onTranscriptionOutput) {
      console.log("[0]: onTranscriptionOutput subscribed");

      window.electronAPI.onTranscriptionOutput((text: string) => {
        console.log("[0]: Received transcription:", text);

        // Ignore segments that are only brackets/parentheses
        if (/^\s*(\[[^\]]*\]|\([^\)]*\))\s*$/i.test(text.trim())) {
          console.log("[0]: Ignored segment:", text);
          return;
        }

        const cleanedText = text.replace(/\[.*?\]/g, "").toLowerCase();
        const words = cleanedText
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter(Boolean);
        if (words.length === 0) return;

        let newWords: string[];
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
            path: await window.electronAPI!.getSignVideoPath(word),
          }))
        ).then((entries) => {
          wordQueueRef.current.push(...entries);
          maintainPreloadBuffer();
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

  const loadNextVideo = async () => {
    if (wordQueueRef.current.length === 0) return;

    const { word, path } = wordQueueRef.current[0];
    const ok = await checkVideoExists(path);
    if (!ok) {
      wordQueueRef.current.shift();
      return;
    }

    const el = document.createElement("video");
    el.preload = "auto";
    el.src = path;
    el.load();

    await new Promise<void>((resolve) => {
      const can = () => {
        el.removeEventListener("canplay", can);
        resolve();
      };
      el.addEventListener("canplay", can);
    });

    preloadedRef.current.push({ word, path, element: el });
    wordQueueRef.current.shift();
  };

  const maintainPreloadBuffer = async () => {
    while (preloadedRef.current.length < 10 && wordQueueRef.current.length > 0) {
      await loadNextVideo();
    }
  };

  const startPlaybackLoop = async () => {
    isPlayingRef.current = true;

    while (true) {
      if (preloadedRef.current.length === 0) {
        if (wordQueueRef.current.length === 0) break;
        await maintainPreloadBuffer();
        if (preloadedRef.current.length === 0) break;
      }

      const { word, element } = preloadedRef.current.shift()!;

      if (word === lastShownWordRef.current) repeatCountRef.current += 1;
      else repeatCountRef.current = 1;
      lastShownWordRef.current = word;

      setCurrentWord(repeatCountRef.current > 1 ? `${word} (${repeatCountRef.current})` : word);

      await new Promise<void>((resolve) => {
        const video = videoRef.current;
        if (!video) return resolve();

        const clean = () => {
          video.removeEventListener("ended", end);
          video.removeEventListener("error", err);
        };

        const end = () => {
          clean();
          setCurrentWord("");
          resolve();
        };

        const err = () => {
          clean();
          setCurrentWord("");
          resolve();
        };

        video.addEventListener("ended", end);
        video.addEventListener("error", err);

        video.src = element.src;
        video.playbackRate = 2;
        video.play().catch(() => {
          clean();
          setCurrentWord("");
          resolve();
        });
      });

      await maintainPreloadBuffer();
    }

    setCurrentWord("");
    isPlayingRef.current = false;
  };

  const checkVideoExists = async (path: string): Promise<boolean> => {
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
