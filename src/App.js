import { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './frontEnd/home/Page';
import SettingsPage from './frontEnd/settings/Page';
import SignPage from './frontEnd/sign/Page';
import SubtitlePage from './frontEnd/subtitle/Page';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/sign" element={<SignPage />} />
              <Route path="/subtitle" element={<SubtitlePage />} />
            </Routes>
          </Router>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
