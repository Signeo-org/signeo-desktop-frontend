// src/contexts/ThemeContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import { createTheme, ThemeProvider, Theme } from "@mui/material/styles";

interface ThemeContextType {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightPalette = {
  primary: { main: "#FDB813" },    // Signeo Gold
  secondary: { main: "#F4A320" },  // Signeo Gold Dark
  background: {
    default: "#e0e5ec",            // Neumorphic light
    paper: "#f0f4f8",
  },
  text: {
    primary: "#2D3748",            // Signeo Slate
    secondary: "#4A5568",
  },
};

const darkPalette = {
  primary: { main: "#FDB813" },    // Signeo Gold
  secondary: { main: "#F4A320" },  // Signeo Gold Dark
  background: {
    default: "#1e293b",            // Neumorphic dark
    paper: "#334155",
  },
  text: {
    primary: "#f1f5f9",
    secondary: "#94a3b8",
  },
};

interface ThemeProviderWrapperProps {
  children: ReactNode;
}

export const ThemeProviderWrapper = ({ children }: ThemeProviderWrapperProps) => {
  const [darkMode, setDarkMode] = useState(false);

  const theme: Theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      ...(darkMode ? darkPalette : lightPalette),
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProviderWrapper");
  }
  return context;
};
