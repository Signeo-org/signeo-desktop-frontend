// src/components/App.js
import React from "react";
import { Outlet } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { ThemeProviderWrapper } from "../contexts/Theme";
import { LanguageProvider } from "../contexts/Language";
import { ToggleProvider } from "../contexts/Toggle";

function App() {
  console.log("App component rendered");
  return (
    <ThemeProviderWrapper>
      <LanguageProvider>
        <ToggleProvider>
          <CssBaseline />
          <main>
            <Outlet />
          </main>
        </ToggleProvider>
      </LanguageProvider>
    </ThemeProviderWrapper>
  );
}

export default App;
