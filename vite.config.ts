import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";

export default defineConfig({
  base: "./",
  server: {
    port: 5173,
  },
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: "src/electron/main.ts",
        vite: {
          build: {
            outDir: "dist/electron",
            emptyOutDir: true,
          },
        },
      },
      preload: {
        input: path.join(__dirname, "src/electron/preload.ts"),
        vite: {
          build: {
            outDir: "dist/electron",
          },
        },
      },
      renderer: process.env.NODE_ENV === "test" ? undefined : {},
    }),
  ],
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
  },
});
