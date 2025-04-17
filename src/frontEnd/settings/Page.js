import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../App';
import { useState } from 'react';

export default function SettingsPage() {
    const navigate = useNavigate();
    const [audioInput, setAudioInput] = useState('Microphone 1');
    const [fontSize, setFontSize] = useState('Medium');
    const [showSignLanguage, setShowSignLanguage] = useState(true);
    const { darkMode } = useTheme();

    return (
        <div className="flex flex-col items-center justify-center h-screen px-4 transition">
            <div className="max-w-md w-full p-8 rounded-2xl shadow-2xl bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 space-y-6">
                <h2 className="text-2xl font-semibold text-center">Settings</h2>

                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block text-gray-600 dark:text-gray-400">Audio Input</label>
                        <select
                            value={audioInput}
                            onChange={(e) => setAudioInput(e.target.value)}
                            className="w-full px-3 py-2 mt-1 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700"
                        >
                            <option>Microphone 1</option>
                            <option>Microphone 2</option>
                            <option>System Audio</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-600 dark:text-gray-400">Subtitles Font Size</label>
                        <select
                            value={fontSize}
                            onChange={(e) => setFontSize(e.target.value)}
                            className="w-full px-3 py-2 mt-1 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700"
                        >
                            <option>Small</option>
                            <option>Medium</option>
                            <option>Large</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-gray-600 dark:text-gray-400">Show Sign Language</label>
                        <input
                            type="checkbox"
                            checked={showSignLanguage}
                            onChange={() => setShowSignLanguage(!showSignLanguage)}
                            className="w-5 h-5"
                        />
                    </div>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="mt-6 w-full text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                    ← Back to Main
                </button>
            </div>
        </div>
    );
}
