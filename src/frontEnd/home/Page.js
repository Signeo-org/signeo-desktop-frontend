import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../App';

const languages = ['English', 'Spanish', 'French', 'German'];

export default function MainPage() {
  const [language, setLanguage] = useState('English');
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 1000); // simulate animation
    alert(`Translating audio into ${language} subtitles and sign language...`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 transition duration-300">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="text-sm text-gray-400 hover:text-blue-500"
        >
          {darkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="max-w-md w-full p-8 rounded-2xl shadow-2xl bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 space-y-6">
        <h1 className="text-4xl font-bold text-center">Audio Interpreter</h1>
        <div className="space-y-2">
          <label htmlFor="language" className="text-sm text-gray-600 dark:text-gray-400">Choose Language</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-lg"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handlePlay}
          className={`w-full px-4 py-2 text-lg font-medium rounded-lg text-white transition-transform transform ${isPlaying ? 'scale-110 bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          ▶ Start Translation
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 w-full text-center"
        >
          ⚙ Settings
        </button>
      </div>
    </div>
  );
}
