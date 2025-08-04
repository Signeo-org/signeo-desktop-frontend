import React, { useEffect, useState } from "react";

function SubtitlePage() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  const [lines, setLines] = useState([]);

  useEffect(() => {
    const handleText = (raw) => {
      console.log("[React] Subtitle received:", raw);

      const cleaned = raw
        .trim()
        .replace(/^\[1\]:\s*/, "")
        .replace(/^\[Transcription\]\s*/, "")
        .trim();

      if (!cleaned) return;

      // ✅ Ignore any segment that is only [something] or (something)
      if (/^\s*(\[[^\]]*\]|\([^\)]*\))\s*$/i.test(cleaned)) {
        console.log("[React] Ignored subtitle because it contains only bracketed/parenthesized content:", cleaned);
        return;
      }

      // ✅ Also strip any bracketed or parenthesized parts within sentences
      const stripped = cleaned.replace(/\[[^\]]*\]|\([^\)]*\)/g, "").trim();
      if (!stripped) return; // if nothing remains, skip

      setLines((prev) => {
        const combined = [...prev, stripped];
        const deduped = combined.filter(
          (line, i, arr) => i === 0 || line !== arr[i - 1]
        );
        return deduped.slice(-2); // keep last 2 lines
      });
    };

    if (window.electronAPI?.onTranscriptionOutput) {
      console.log("[React] Subscribed to transcription-output");
      window.electronAPI.onTranscriptionOutput(handleText);
    }
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
