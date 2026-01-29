import { useEffect, useRef, useState } from "react";
import { useTheme } from "../App";

interface WordEntry { word: string; path: string; }
interface PreloadedEntry extends WordEntry { element: HTMLVideoElement; }

function SignPage() {
  const { darkMode } = useTheme();
  const [currentWord, setCurrentWord] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const wordQueueRef = useRef<WordEntry[]>([]);
  const preloadedRef = useRef<PreloadedEntry[]>([]);
  const lastShownWordRef = useRef("");
  const repeatCountRef = useRef(1);

  const isPlayingRef = useRef(false);
  const lastTranscriptRef = useRef("");
  const lastIndexRef = useRef(0);

  useEffect(() => {
    if (!window.electronAPI?.onTranscriptionOutput) return;

    window.electronAPI.onTranscriptionOutput(async (text: string) => {
      if (/^\s*(\[[^\]]*\]|\([^\)]*\))\s*$/i.test(text.trim())) return;

      // Clean: remove brackets, lowercase, then remove all punctuation for consistent comparison
      const rawCleaned = text.replace(/\[.*?\]/g, "").toLowerCase();
      const cleanedText = rawCleaned.replace(/[^\w\s]/g, "").trim();
      const words = cleanedText.split(/\s+/).filter(Boolean);
      if (!words.length) return;

      let newWords: string[];
      if (!cleanedText.startsWith(lastTranscriptRef.current)) {
        newWords = words;
        lastIndexRef.current = 0;
      } else {
        newWords = words.slice(lastIndexRef.current);
      }

      lastTranscriptRef.current = cleanedText;
      lastIndexRef.current = words.length;

      const entries = await Promise.all(newWords.map(async (word) => ({
        word,
        path: await window.electronAPI!.getSignVideoPath(word)
      })));

      wordQueueRef.current.push(...entries);
      startPlaybackLoop(); // safely call multiple times
    });
  }, []);

  const checkVideoExists = async (path: string) => {
    try {
      const res = await fetch(path, { method: "HEAD" });
      return res.ok;
    } catch { return false; }
  };

  const loadNextVideo = async () => {
    if (!wordQueueRef.current.length) return;

    const { word, path } = wordQueueRef.current[0];
    if (!await checkVideoExists(path)) {
      wordQueueRef.current.shift();
      return;
    }

    const el = document.createElement("video");
    el.preload = "auto";
    el.src = path;
    el.load();

    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      const cleanup = () => {
        if (resolved) return;
        resolved = true;
        el.removeEventListener("canplay", onCan);
        el.removeEventListener("error", onError);
      };

      const onCan = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error(`Failed to load video: ${word}`)); };

      // Check if already ready (can happen with cached files)
      if (el.readyState >= 3) {
        cleanup();
        resolve();
        return;
      }

      el.addEventListener("canplay", onCan);
      el.addEventListener("error", onError);

      // Timeout fallback - don't wait forever
      setTimeout(() => {
        if (!resolved) {
          cleanup();
          // If we have some data, proceed anyway
          if (el.readyState >= 2) resolve();
          else reject(new Error(`Timeout loading video: ${word}`));
        }
      }, 5000);
    });

    preloadedRef.current.push({ word, path, element: el });
    wordQueueRef.current.shift();
  };

  const maintainPreloadBuffer = async () => {
    while (preloadedRef.current.length < 10 && wordQueueRef.current.length) {
      await loadNextVideo().catch(e => {
        console.error("Preload failed", e);
        wordQueueRef.current.shift();
      });
    }
  };

  const startPlaybackLoop = async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    try {
      while (true) {
        try {
          if (!preloadedRef.current.length) await maintainPreloadBuffer();

          const entry = preloadedRef.current.shift();
          if (!entry) { await new Promise(r => setTimeout(r, 100)); continue; }

          const { word, element } = entry;
          if (word === lastShownWordRef.current) repeatCountRef.current++;
          else repeatCountRef.current = 1;
          lastShownWordRef.current = word;

          setCurrentWord(repeatCountRef.current > 1 ? `${word} (${repeatCountRef.current})` : word);

          const video = videoRef.current;
          if (!video) continue;

          await new Promise<void>((resolve) => {
            let resolved = false;
            const clean = () => {
              if (!resolved) {
                resolved = true;
                // Remove event listeners to prevent accumulation
                video.removeEventListener("ended", onEnded);
                video.removeEventListener("error", onError);
                resolve();
              }
            };

            const onEnded = () => { clean(); setCurrentWord(""); };
            const onError = (e?: any) => { console.error("Video error", word, e); clean(); setCurrentWord(""); };

            video.addEventListener("ended", onEnded, { once: true });
            video.addEventListener("error", onError, { once: true });

            video.src = element.src;
            video.playbackRate = 2;
            video.play().catch(e => { console.warn("Play failed", word, e); clean(); });
          });

        } catch (loopError) {
          console.error("Playback loop error:", loopError);
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } finally {
      isPlayingRef.current = false;
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
