// src/contexts/SettingsContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Language {
  code: string;
  name: string;
}

interface Settings {
  subtitles: boolean;
  signLanguage: boolean;
  fontSize: string;
  audioInput: string;
  language: string;
}

interface SettingsContextType extends Settings {
  availableLanguages: Language[];
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setSubtitles: (value: boolean) => void;
  setSignLanguage: (value: boolean) => void;
  setFontSize: (value: string) => void;
  setAudioInput: (value: string) => void;
  setLanguage: (value: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const AVAILABLE_LANGUAGES: Language[] = [
  { code: "en-US", name: "English" },
  { code: "es-ES", name: "Spanish (Work in Progress)" },
  { code: "fr-FR", name: "French (Work in Progress)" },
  { code: "de-DE", name: "German (Work in Progress)" },
];

const getDefaultSettings = (): Settings => ({
  subtitles: true,
  signLanguage: true,
  fontSize: "Medium",
  audioInput: "Microphone 1",
  language: AVAILABLE_LANGUAGES.some((lang) => lang.code === navigator.language)
    ? navigator.language
    : "en-US",
});

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("appSettings");
    return saved ? (JSON.parse(saved) as Settings) : getDefaultSettings();
  });

  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const contextValue: SettingsContextType = {
    ...settings,
    availableLanguages: AVAILABLE_LANGUAGES,
    updateSetting,
    setSubtitles: (value) => updateSetting("subtitles", value),
    setSignLanguage: (value) => updateSetting("signLanguage", value),
    setFontSize: (value) => updateSetting("fontSize", value),
    setAudioInput: (value) => updateSetting("audioInput", value),
    setLanguage: (value) => updateSetting("language", value),
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
