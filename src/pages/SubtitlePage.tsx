// src/pages/SubtitlePage.tsx
import { useEffect, useState, useRef, useMemo } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useTheme } from "../App";

type FontSize = "Small" | "Medium" | "Large";

function SubtitlePage() {
  const { darkMode } = useTheme();
  const { fontSize } = useSettings();
  const [lines, setLines] = useState<string[]>([]);
  const measureRef = useRef<HTMLDivElement>(null);

  const fontSizeClass = useMemo(() => {
    const classes: Record<FontSize, string> = {
      Small: "text-xl",
      Medium: "text-3xl",
      Large: "text-5xl",
    };
    return classes[fontSize as FontSize] || "text-3xl";
  }, [fontSize]);

  useEffect(() => {
    const handleText = (data: { text: string; type: "partial" | "final" }) => {
      const raw = data.text;
      const cleaned = raw
        .trim()
        .replace(/^\[1\]:\s*/, "")
        .replace(/^\[Transcription\]\s*/, "")
        .replace(/\[[^\]]*\]|\([^\)]*\)/g, "")
        .trim();
      if (!cleaned) return;

      setLines((prev) => {
        const combined = [...prev, cleaned];
        const deduped = combined.filter((line, i, arr) => i === 0 || line !== arr[i - 1]);
        return deduped.slice(-2); // keep last 2 lines
      });
    };

    window.electronAPI?.onTranscriptionOutput?.(handleText);
  }, []);

  useEffect(() => {
    if (measureRef.current && window.electronAPI?.reportSubtitleSize) {
      const { offsetWidth: width, offsetHeight: height } = measureRef.current;
      window.electronAPI.reportSubtitleSize({ width, height });
    }
  }, [lines, fontSize]);

  return (
    <div
      ref={measureRef}
      className={`flex flex-col items-center justify-center text-center font-semibold px-4 ${fontSizeClass} ${darkMode ? "text-white" : "text-white"
        }`}
      style={{ width: '700pt', overflow: 'hidden', scrollbarWidth: 'none' }}
    >
      <div style={{ marginBottom: '20pt' }}>
        {lines.length > 0 ? (
          lines.map((line, idx) => <div key={idx} style={{ overflow: 'hidden', scrollbarColor: '#12737' }}>{line}</div>)
        ) : (
          <h1>No text received yet</h1>
        )}
      </div>
    </div>
  );
}

export default SubtitlePage;
