import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Type, Subtitles, HandMetal, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../App";
import { useSettings } from "../contexts/SettingsContext";

type FontSize = "Small" | "Medium" | "Large";

type SignMediaItem = {
  label: string;
  originalName: string;
  ext: ".mp4" | ".gif";
  addedAtUtc: string;
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();
  const { fontSize, signLanguage, subtitles, setFontSize, setSignLanguage, setSubtitles } =
    useSettings();

  const fontSizeClass = useMemo(() => {
    const classes: Record<FontSize, string> = {
      Small: "text-xl",
      Medium: "text-3xl",
      Large: "text-5xl",
    };
    return classes[fontSize as FontSize] || "text-3xl";
  }, [fontSize]);

  const toggleWindow = (type: "subtitle" | "sign") => {
    if (type === "subtitle") setSubtitles(!subtitles);
    if (type === "sign") setSignLanguage(!signLanguage);
  };

  // ---------------- Custom Signs ----------------
  const [signItems, setSignItems] = useState<SignMediaItem[]>([]);
  const [importLabel, setImportLabel] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importErr, setImportErr] = useState<string | null>(null);

  const refreshSignList = async () => {
    const api = window.electronAPI;
    if (!api?.listSignMedia) return;
    const res = await api.listSignMedia();
    if (res.ok) setSignItems(res.items);
  };

  useEffect(() => {
    refreshSignList();
  }, []);

  const handleImport = async () => {
    setImportErr(null);
    setImportBusy(true);
    try {
      const api = window.electronAPI;
      if (!api?.importSignMediaPick || !api?.saveSignMedia) {
        setImportErr("Electron API not available");
        return;
      }

      const picked = await api.importSignMediaPick();
      if (!picked.ok) {
        if (!picked.canceled) setImportErr(picked.error ?? "Import failed");
        return;
      }

      const label = importLabel.trim();
      if (!label) {
        setImportErr("Please enter a label (ex: hello)");
        return;
      }

      const saved = await api.saveSignMedia(picked.src, label);
      if (!saved.ok) {
        setImportErr(saved.error);
        return;
      }

      setImportLabel("");
      await refreshSignList();
    } finally {
      setImportBusy(false);
    }
  };

  const handleRemove = async (label: string) => {
    const api = window.electronAPI;
    if (!api?.removeSignMedia) return;
    const res = await api.removeSignMedia(label);
    if (res.ok) await refreshSignList();
  };
  // ------------------------------------------------

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
        ${
          darkMode
            ? "bg-linear-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]"
            : "bg-linear-to-br from-[#e0e5ec] via-[#e8ecf0] to-[#d5dce3]"
        }
      `}
    >
      {/* Glass container */}
      <div className="relative w-full max-w-2xl animate-fade-in-up">
        <div
          className={`relative backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 md:p-12 border transition-all duration-300
            ${
              darkMode
                ? "bg-slate-800/40 border-slate-700/50 shadow-[20px_20px_60px_#0a0f1a,-20px_-20px_60px_#1e293b]"
                : "bg-white/40 border-white/50 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]"
            }
          `}
        >
          {/* Theme toggle */}
          <div className="absolute top-8 right-8">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-4 rounded-2xl transition-all duration-200 group
                ${
                  darkMode
                    ? "bg-[#1e293b] shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#2d3e56] hover:shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56] active:shadow-[inset_3px_3px_6px_#0f172a,inset_-3px_-3px_6px_#2d3e56]"
                    : "bg-[#e0e5ec] shadow-[6px_6px_12px_#c5cad1,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff] active:shadow-[inset_3px_3px_6px_#c5cad1,inset_-3px_-3px_6px_#ffffff]"
                }
              `}
              aria-label="Toggle theme"
            >
              {!darkMode ? (
                <Moon className="w-5 h-5 text-[#5a6c7d] group-hover:text-[#FDB813] transition-colors duration-300" />
              ) : (
                <Sun className="w-5 h-5 text-[#94a3b8] group-hover:text-[#FDB813] transition-colors duration-300" />
              )}
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 mb-10 animate-fade-in-up [animation-delay:100ms] opacity-0 fill-mode-forwards">
            <button
              onClick={() => navigate("/")}
              className={`group p-3 rounded-xl transition-all
                ${
                  darkMode
                    ? "bg-[#1e293b] shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56] hover:shadow-[inset_2px_2px_4px_#0f172a,inset_-2px_-2px_4px_#2d3e56]"
                    : "bg-[#e0e5ec] shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_#c5cad1,inset_-2px_-2px_4px_#ffffff]"
                }
              `}
            >
              <ArrowLeft
                className={`w-5 h-5 transition-all duration-300 group-hover:text-[#FDB813] group-hover:-translate-x-1 ${
                  darkMode ? "text-slate-300" : "text-[#5a6c7d]"
                }`}
              />
            </button>

            <h1 className={`text-3xl font-bold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>
              Settings
            </h1>
          </div>

          <div className="space-y-8 animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards">
            {/* Font size card */}
            <div
              className={`p-6 rounded-2xl transition-all
                ${
                  darkMode
                    ? "bg-slate-700/30 border border-slate-600/30"
                    : "bg-linear-to-br from-white/60 to-white/30 border border-white/50"
                }
              `}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-yellow-500/20" : "bg-yellow-500/10"}`}>
                  <Type className="w-5 h-5 text-[#FDB813]" />
                </div>
                <span className={`font-semibold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>
                  Subtitle Size
                </span>
              </div>

              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl backdrop-blur border
                  ${darkMode ? "bg-slate-900/40 border-slate-700 text-slate-200" : "bg-white/60 border-white/70"}
                `}
              >
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>

              <div className={`p-4 mt-2 rounded-lg text-center ${darkMode ? "bg-slate-800/50" : "bg-white/50"}`}>
                <span className={`${fontSizeClass} ${darkMode ? "text-slate-200" : "text-[#2c3e50]"}`}>
                  Preview Text
                </span>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subtitles */}
              <div
                className={`p-6 rounded-2xl transition-all
                  ${
                    darkMode
                      ? "bg-slate-700/30 border border-slate-600/30"
                      : "bg-linear-to-br from-white/60 to-white/30 border border-white/50"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-3 rounded-full ${darkMode ? "bg-emerald-500/20" : "bg-emerald-500/10"}`}>
                    <Subtitles className="w-6 h-6 text-[#10b981]" />
                  </div>

                  <span className={`font-semibold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>
                    Subtitles
                  </span>
                  <button
                    onClick={() => toggleWindow("subtitle")}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      subtitles
                        ? darkMode
                          ? "bg-linear-to-br from-[#10b981] to-[#059669] text-white shadow-[4px_4px_12px_#047857,-4px_-4px_12px_#14b885]"
                          : "bg-linear-to-br from-[#10b981] to-[#059669] text-white shadow-[4px_4px_12px_#059669,-4px_-4px_12px_#34d399]"
                        : darkMode
                        ? "bg-[#1e293b] text-slate-400 shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56]"
                        : "bg-[#e0e5ec] text-[#5a6c7d] shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff]"
                    }`}
                  >
                    {subtitles ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              {/* Signs */}
              <div
                className={`p-6 rounded-2xl transition-all
                  ${
                    darkMode
                      ? "bg-slate-700/30 border border-slate-600/30"
                      : "bg-linear-to-br from-white/60 to-white/30 border border-white/50"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-3 rounded-full ${darkMode ? "bg-amber-500/20" : "bg-amber-500/10"}`}>
                    <HandMetal className="w-6 h-6 text-[#f59e0b]" />
                  </div>

                  <span className={`font-semibold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>
                    Signs
                  </span>
                  <button
                    onClick={() => toggleWindow("sign")}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      signLanguage
                        ? darkMode
                          ? "bg-linear-to-br from-[#f59e0b] to-[#d97706] text-white shadow-[4px_4px_12px_#b45309,-4px_-4px_12px_#fbbf24]"
                          : "bg-linear-to-br from-[#f59e0b] to-[#d97706] text-white shadow-[4px_4px_12px_#d97706,-4px_-4px_12px_#fbbf24]"
                        : darkMode
                        ? "bg-[#1e293b] text-slate-400 shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56]"
                        : "bg-[#e0e5ec] text-[#5a6c7d] shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff]"
                    }`}
                  >
                    {signLanguage ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom sign media */}
            <div
              className={`p-6 rounded-2xl transition-all
                ${
                  darkMode
                    ? "bg-slate-700/30 border border-slate-600/30"
                    : "bg-linear-to-br from-white/60 to-white/30 border border-white/50"
                }
              `}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${darkMode ? "bg-amber-500/20" : "bg-amber-500/10"}`}>
                    <HandMetal className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  <span className={`font-semibold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>
                    Custom signs (MP4/GIF)
                  </span>
                </div>

                <button
                  onClick={handleImport}
                  disabled={importBusy}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    importBusy
                      ? "opacity-60 cursor-not-allowed"
                      : darkMode
                      ? "bg-[#1e293b] text-slate-200"
                      : "bg-[#e0e5ec] text-[#2c3e50]"
                  }`}
                >
                  {importBusy ? "Importing..." : "Import"}
                </button>
              </div>

              <input
                value={importLabel}
                onChange={(e) => setImportLabel(e.target.value)}
                placeholder="Label (ex: hello)"
                className={`w-full px-4 py-3 rounded-xl backdrop-blur border mb-2
                  ${
                    darkMode
                      ? "bg-slate-900/40 border-slate-700 text-slate-200"
                      : "bg-white/60 border-white/70"
                  }
                `}
              />

              {importErr && (
                <div className={`mt-2 text-sm ${darkMode ? "text-red-300" : "text-red-600"}`}>
                  {importErr}
                </div>
              )}

              <div className="mt-4 space-y-2">
                {signItems.length === 0 ? (
                  <div className={`${darkMode ? "text-slate-300" : "text-[#5a6c7d]"}`}>
                    No custom signs yet.
                  </div>
                ) : (
                  signItems.map((it) => (
                    <div
                      key={it.label}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl
                        ${darkMode ? "bg-slate-800/40" : "bg-white/40"}
                      `}
                    >
                      <div className="min-w-0">
                        <div
                          className={`font-medium truncate ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}
                        >
                          {it.label}{" "}
                          <span className={`${darkMode ? "text-slate-400" : "text-[#5a6c7d]"}`}>
                            ({it.ext})
                          </span>
                        </div>
                        <div className={`text-xs truncate ${darkMode ? "text-slate-400" : "text-[#5a6c7d]"}`}>
                          {it.originalName} — {it.addedAtUtc}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(it.label)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                          ${darkMode ? "bg-red-500/20 text-red-200" : "bg-red-500/10 text-red-700"}
                        `}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* end custom signs */}
          </div>
        </div>
      </div>
    </div>
  );
}
