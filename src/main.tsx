import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/tailwind.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Use contextBridge
// Listen the new, type-safe way
window.electronAPI.on("main-process-message", (_e, message) => {
  console.log(message);
});

// If you need the build mode inside React:
console.log("Renderer is running in", import.meta.env.MODE); // "development" | "production"
