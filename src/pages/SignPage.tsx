import { useEffect, useRef, useState } from "react";
import { useTheme } from "../App";
import { shouldIgnoreWord } from "../utils/textUtils";

interface WordEntry { word: string; path: string; }
interface PreloadedEntry extends WordEntry { element: HTMLVideoElement | null;  }


function SignPage() {
  const { darkMode } = useTheme();
  const [currentWord, setCurrentWord] = useState("");
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);

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

    window.electronAPI.onTranscriptionOutput(async (data: { text: string; type: "partial" | "final" }) => {
      const text = data.text;
      if (/^\s*(\[[^\]]*\]|\([^\)]*\))\s*$/i.test(text.trim())) return;

      // const { shouldIgnoreWord } = await import("../utils/textUtils"); // Removed dynamic import

      // Split by whitespace first to preserve original punctuation for display
      const allWords = text.trim().split(/\s+/).filter(Boolean);

      // Filter: Check if the CLEANED word should be ignored
      // We map to an object first to keep both raw and clean versions
      const wordsToPlay = await Promise.all(allWords.map(async (rawWord) => {
        const { cleanWord, shouldIgnoreWord } = await import("../utils/textUtils");
        const clean = cleanWord(rawWord);
        if (!clean || shouldIgnoreWord(clean)) return null;

        // Get path for the CLEANED word
        const path = await window.electronAPI!.getSignVideoPath(clean);
        return { word: rawWord, path }; // Keep rawWord for display!
      }));
      

      // Filter out nulls
      const validEntries = wordsToPlay.filter((w): w is WordEntry => w !== null);

      if (!validEntries.length) return;

      // ... existing logic for newWords slice ...
      // But wait, check logic for newWords slice based on *cleaned* text? 
      // Actually, relying on `lastTranscriptRef` being the full cleaned text is tricky if we want to support partials correctly.
      // The current logic:
      // const cleanedText = rawCleaned.replace(/[^\w\s]/g, "").trim();
      // if (!cleanedText.startsWith(lastTranscriptRef.current)) ...

      // Let's stick to the user's immediate request: "Hello?" -> "hello" for path, "Hello?" for display.
      // We need to adapt the append logic.

      // Simpler approach: Just process the *new* words.
      // But `onTranscriptionOutput` provides the *full* current segment text usually?
      // Wait, `onTranscriptionOutput` sends "partial" updates which are the full text of the current sentence *so far*.
      // So we do need to diff.

      // Let's reconstruct the cleaned text for diffing purposes
      const normalizeForDiff = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
      const currentFullClean = normalizeForDiff(text);

      let newEntries: WordEntry[] = [];

      // If the current text starts with the last text, we just append the new words
      // Otherwise (new sentence or correction), we reset
      if (currentFullClean.startsWith(lastTranscriptRef.current) && lastTranscriptRef.current.length > 0) {
        // We need to skip the first N valid words we already processed
        // This is getting complicated with the raw/clean mapping.
        // A simpler heuristic:
        // `lastIndexRef` stores how many words we already processed.
        newEntries = validEntries.slice(lastIndexRef.current);
      } else {
        // Reset or new sentence
        newEntries = validEntries;
        lastIndexRef.current = 0;
      }

      lastTranscriptRef.current = currentFullClean;
      lastIndexRef.current = validEntries.length;

      wordQueueRef.current.push(...newEntries);
      startPlaybackLoop();
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
    const exists = await checkVideoExists(path);

    if (!exists) {
      // Fallback: get image path via new IPC function
      const imgPath = await window.electronAPI.getWordPicturePath(word);
      preloadedRef.current.push({ word, path: imgPath, element: null }); // Use null, not undefined
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
      if (el.readyState >= 3) { cleanup(); resolve(); return; }
      el.addEventListener("canplay", onCan);
      el.addEventListener("error", onError);
      setTimeout(() => {
        if (!resolved) {
          cleanup();
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
      if (!preloadedRef.current.length) await maintainPreloadBuffer();

      const entry = preloadedRef.current.shift();
      if (!entry) { await new Promise(r => setTimeout(r, 100)); continue; }

      const { word, element, path } = entry;
      if (word === lastShownWordRef.current) repeatCountRef.current++;
      else repeatCountRef.current = 1;
      lastShownWordRef.current = word;
      setCurrentWord(repeatCountRef.current > 1 ? `${word} (${repeatCountRef.current})` : word);

      const video = videoRef.current;
      if (!video) continue;

      if (element) {
        // Video playback
        await new Promise<void>((resolve) => {
          let resolved = false;
          const clean = () => { if (!resolved) { resolved = true; video.removeEventListener("ended", onEnded); video.removeEventListener("error", onError); resolve(); } };
          const onEnded = () => { clean(); setCurrentWord(""); };
          const onError = () => { console.error("Video error", word); clean(); setCurrentWord(""); };

          video.addEventListener("ended", onEnded, { once: true });
          video.addEventListener("error", onError, { once: true });

          video.src = element.src;
          video.playbackRate = 2;
          video.play().catch(() => clean());
        });
      } else {
        // Image fallback: show 1 second
        video.src = ""; // Hide video
        const img = document.createElement("img");
        img.src = path; // fallback image path
        img.style.maxHeight = "80vh";
        img.style.maxWidth = "90vw";
        img.style.position = "absolute";
        img.style.top = "50%";
        img.style.left = "50%";
        img.style.transform = "translate(-50%, -50%)";
        if (!element) {
          video.src = "";
          setFallbackImage(path); // Show image in React

          await new Promise(r => setTimeout(r, 500)); // Keep it visible for 1s

          setFallbackImage(null);
          setCurrentWord("");
        }
      }
    }
  } finally {
    isPlayingRef.current = false;
  }
};

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          maxHeight: "80vh",
          maxWidth: "90vw",
          visibility: currentWord && !fallbackImage ? "visible" : "hidden",
        }}
      />
      {fallbackImage && (
        <img
          src={fallbackImage}
          alt="Fallback"
          style={{
            maxHeight: "80vh",
            maxWidth: "90vw",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      {currentWord ? (
        <h2 className="mt-4 text-2xl font-bold z-10">Showing: {currentWord}</h2>
      ) : (
        <h1 className="mt-4">Waiting for signs...</h1>
      )}
    </div>
  );
}

export default SignPage;
