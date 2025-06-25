import { createContext, useContext, useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

// Electron API types are now in electron-env.d.ts
import { SettingsProvider } from "./contexts/SettingsContext";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import SignPage from "./pages/SignPage";
import SubtitlePage from "./pages/SubtitlePage";

const ThemeContext = createContext({
  darkMode: false,
  setDarkMode: (value: boolean) => {},
});

export const useTheme = () => useContext(ThemeContext);

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage if available
    const savedTheme = localStorage.getItem("darkMode");
    return savedTheme ? savedTheme === "true" : true;
  });

  // Handle theme changes from other windows
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleThemeUpdate = (darkMode: boolean) => {
      setDarkMode(darkMode);
      localStorage.setItem("darkMode", String(darkMode));
    };

    // Listen for theme updates from other windows
    window.electronAPI.onUpdateTheme(handleThemeUpdate);

    // Load initial theme
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme !== null) {
      const isDark = savedTheme === "true";
      setDarkMode(isDark);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Update theme in all windows when it changes
  const updateTheme = (newTheme: boolean) => {
    setDarkMode(newTheme);
    localStorage.setItem("darkMode", String(newTheme));

    if (window.electronAPI) {
      window.electronAPI.updateTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode: updateTheme }}>
      <SettingsProvider>
        <div className={darkMode ? "dark" : ""}>
          <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
            <HashRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/sign" element={<SignPage />} />
                <Route path="/subtitle" element={<SubtitlePage />} />
              </Routes>
            </HashRouter>
          </div>
        </div>
      </SettingsProvider>
    </ThemeContext.Provider>
  );
}
export default App;
