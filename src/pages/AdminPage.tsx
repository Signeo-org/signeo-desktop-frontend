// src/pages/AdminPage.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../App";
import { useApp } from "../contexts/AppContext";
import { ArrowLeft, RefreshCw, Database, FileText, Ban } from "lucide-react";
import { shouldIgnoreWord, cleanWord } from "../utils/textUtils";

export default function AdminPage() {
    const { darkMode } = useTheme();
    const { transcriptHistory, partialTranscript } = useApp();
    const navigate = useNavigate();
    const [availableWords, setAvailableWords] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDatabaseStats();
    }, []);

    const loadDatabaseStats = async () => {
        if (!window.electronAPI?.getDatabaseStat) return;
        setLoading(true);
        try {
            const words = await window.electronAPI.getDatabaseStat();
            // Normalize to lowercase for case-insensitive matching
            setAvailableWords(new Set(words.map((w: string) => w.toLowerCase())));
        } catch (error) {
            console.error("Failed to load DB stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const processedTranscript = useMemo(() => {
        const historyText = transcriptHistory.join(" ");
        // If we have a partial transcript, append it
        const fullText = partialTranscript ? `${historyText} ${partialTranscript}` : historyText;

        if (!fullText.trim()) return [];

        const items = fullText.split(/\s+/);

        // Calculate where the partial text starts (rough approximation by index count)
        // A better way is to process history and partial separately, but splitting the full string ensures layout consistency.
        // We'll trust the order: duplicate words at the seam might trigger weirdness but it's visual only.
        // Actually, safer to map history and partial separately and concat arrays.

        const historyItems = transcriptHistory.join(" ").split(/\s+/).filter(Boolean).map((w, i) => ({ word: w, isPartial: false }));
        let partialItems = partialTranscript.split(/\s+/).filter(Boolean).map((w, i) => ({ word: w, isPartial: true }));

        // Overlap detection: Remove words from partial that already exist at the end of history
        // This handles cases where the backend sends a partial update that overlaps with the recently finalized segment.
        if (historyItems.length > 0 && partialItems.length > 0) {
            const cleanHistory = historyItems.map(i => cleanWord(i.word));
            const cleanPartial = partialItems.map(i => cleanWord(i.word));

            // Check for overlap of length N, starting from the largest possible overlap
            const maxOverlap = Math.min(cleanHistory.length, cleanPartial.length);

            for (let n = maxOverlap; n > 0; n--) {
                const historySuffix = cleanHistory.slice(-n);
                const partialPrefix = cleanPartial.slice(0, n);

                if (historySuffix.every((val, i) => val === partialPrefix[i])) {
                    partialItems = partialItems.slice(n);
                    break;
                }
            }
        }

        const allItems = [...historyItems, ...partialItems];

        return allItems.map((item, index) => {
            // Normalize word using the centralized helper
            const normalizedWord = cleanWord(item.word);

            const isIgnored = shouldIgnoreWord(normalizedWord);
            let found = false;

            if (!isIgnored) {
                found = availableWords.has(normalizedWord);
            }

            return { ...item, found, isIgnored, key: `${index}-${item.word}` };
        });
    }, [transcriptHistory, partialTranscript, availableWords]);

    const stats = useMemo(() => {
        if (processedTranscript.length === 0) return { found: 0, missing: 0, ignored: 0, ratio: 0 };

        const relevantItems = processedTranscript.filter(i => !i.isIgnored);
        const found = relevantItems.filter(i => i.found).length;
        const missing = relevantItems.length - found;
        const ignored = processedTranscript.length - relevantItems.length;

        const ratio = relevantItems.length > 0 ? (found / relevantItems.length) * 100 : 0;

        return { found, missing, ignored, ratio };
    }, [processedTranscript]);

    return (
        <div
            className={`min-h-screen p-8 transition-colors duration-300 flex justify-center
        ${darkMode
                    ? "bg-linear-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-slate-200"
                    : "bg-linear-to-br from-[#e0e5ec] via-[#e8ecf0] to-[#d5dce3] text-gray-800"}
      `}
        >
            <div className="max-w-6xl w-full space-y-8 animate-fade-in-up">

                {/* Header Container - Glass Style */}
                <div className={`rounded-[2.5rem] p-6 lg:p-8 backdrop-blur-2xl border transition-all duration-300 flex items-center justify-between
                    ${darkMode
                        ? "bg-slate-800/40 border-slate-700/50 shadow-[20px_20px_60px_#0a0f1a,-20px_-20px_60px_#1e293b]"
                        : "bg-white/40 border-white/50 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]"}
                `}>
                    <button
                        onClick={() => navigate("/")}
                        className={`group p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 font-medium px-5
              ${darkMode
                                ? "bg-[#1e293b] shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#2d3e56] hover:shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56] text-slate-400 hover:text-[#FDB813]"
                                : "bg-[#e0e5ec] shadow-[6px_6px_12px_#c5cad1,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff] text-slate-600 hover:text-[#FDB813]"}
            `}
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>

                    <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>
                        Database Analysis
                    </h1>

                    <button
                        onClick={loadDatabaseStats}
                        title="Refresh Stats"
                        className={`p-3 rounded-2xl transition-all duration-200 group
              ${darkMode
                                ? "bg-[#1e293b] shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#2d3e56] hover:shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56] text-slate-300"
                                : "bg-[#e0e5ec] shadow-[6px_6px_12px_#c5cad1,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff] text-slate-600"}
            `}
                    >
                        <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Found Card */}
                    <div className={`p-6 rounded-[2rem] backdrop-blur-md border transition-all duration-300 flex flex-col items-center justify-center gap-2
            ${darkMode ? "bg-slate-700/30 border-slate-600/30 shadow-lg hover:bg-slate-700/40" : "bg-white/60 border-white/50 shadow-lg hover:bg-white/70"}`}>
                        <div className={`p-4 rounded-full mb-2 ${darkMode ? "bg-green-500/20" : "bg-green-500/10"}`}>
                            <Database className="w-8 h-8 text-green-500" />
                        </div>
                        <div className={`text-4xl font-bold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>{stats.found}</div>
                        <div className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Found Words</div>
                    </div>

                    {/* Missing Card */}
                    <div className={`p-6 rounded-[2rem] backdrop-blur-md border transition-all duration-300 flex flex-col items-center justify-center gap-2
            ${darkMode ? "bg-slate-700/30 border-slate-600/30 shadow-lg hover:bg-slate-700/40" : "bg-white/60 border-white/50 shadow-lg hover:bg-white/70"}`}>
                        <div className={`p-4 rounded-full mb-2 ${darkMode ? "bg-red-500/20" : "bg-red-500/10"}`}>
                            <FileText className="w-8 h-8 text-red-500" />
                        </div>
                        <div className={`text-4xl font-bold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>{stats.missing}</div>
                        <div className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Missing Words</div>
                    </div>

                    {/* Ignored Card */}
                    <div className={`p-6 rounded-[2rem] backdrop-blur-md border transition-all duration-300 flex flex-col items-center justify-center gap-2
            ${darkMode ? "bg-slate-700/30 border-slate-600/30 shadow-lg hover:bg-slate-700/40" : "bg-white/60 border-white/50 shadow-lg hover:bg-white/70"}`}>
                        <div className={`p-4 rounded-full mb-2 ${darkMode ? "bg-gray-500/20" : "bg-gray-500/10"}`}>
                            <Ban className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className={`text-4xl font-bold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>{stats.ignored}</div>
                        <div className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Ignored Words</div>
                    </div>

                    {/* Ratio Card */}
                    <div className={`p-6 rounded-[2rem] backdrop-blur-md border transition-all duration-300 flex flex-col items-center justify-center gap-2
             ${darkMode ? "bg-slate-700/30 border-slate-600/30 shadow-lg hover:bg-slate-700/40" : "bg-white/60 border-white/50 shadow-lg hover:bg-white/70"}`}>
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path className={darkMode ? "text-slate-600" : "text-gray-200"} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path className="text-[#FDB813] transition-all duration-1000 ease-out" strokeDasharray={`${stats.ratio}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                            <span className={`text-lg font-bold ${darkMode ? "text-slate-100" : "text-[#2c3e50]"}`}>{stats.ratio.toFixed(0)}%</span>
                        </div>
                        <div className={`text-sm font-medium text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Coverage Ratio <br /><span className="text-xs opacity-70">(Excl. Stop Words)</span></div>
                    </div>
                </div>

                {/* Transcript View Container */}
                <div className={`rounded-[2.5rem] backdrop-blur-2xl border transition-all duration-300 overflow-hidden flex flex-col min-h-[500px]
          ${darkMode
                        ? "bg-slate-800/40 border-slate-700/50 shadow-[20px_20px_60px_#0a0f1a,-20px_-20px_60px_#1e293b]"
                        : "bg-white/40 border-white/50 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]"}
        `}>
                    <div className={`p-6 border-b flex items-center gap-3 ${darkMode ? "border-slate-700/50 bg-slate-800/30" : "border-white/50 bg-white/30"}`}>
                        <div className={`w-3 h-3 rounded-full animate-pulse ${processedTranscript.length > 0 ? "bg-green-500" : "bg-gray-400"}`}></div>
                        <h2 className={`text-lg font-semibold ${darkMode ? "text-slate-200" : "text-[#2c3e50]"}`}>Live Transcript Analysis</h2>
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto leading-relaxed text-lg scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent">
                        {processedTranscript.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-40 gap-4">
                                <div className={`p-6 rounded-full ${darkMode ? "bg-slate-800" : "bg-white/50"}`}>
                                    <FileText className="w-12 h-12" />
                                </div>
                                <p className="text-xl font-medium">Waiting for transcription...</p>
                                <p className="text-sm">Start talking to see real-time analysis</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3 content-start">
                                {processedTranscript.map((item) => (
                                    <span
                                        key={item.key}
                                        className={`px-3 py-1.5 rounded-xl transition-all duration-300 select-all border font-medium text-base
                        ${item.isPartial
                                                ? `border-dashed ${darkMode ? "border-slate-600 text-slate-400 bg-slate-800/50" : "border-slate-300 text-slate-500 bg-white/50"} opacity-70 italic`
                                                : item.isIgnored
                                                    ? `${darkMode ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-200/50 border-slate-300 text-slate-500"}`
                                                    : item.found
                                                        ? `${darkMode ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"} shadow-sm`
                                                        : `${darkMode ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-rose-500/10 border-rose-500/30 text-rose-700"} shadow-sm`
                                            }
                      `}
                                        title={item.isPartial ? "Processing..." : item.isIgnored ? "Ignored (Stop Word)" : item.found ? "Found in Database" : "Missing from Database"}
                                    >
                                        {item.word}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
