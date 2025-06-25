/// <reference types="vite-plugin-electron/electron-env" />

import { IpcRendererEvent } from 'electron';

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

export {}; // Make this a module

declare global {
  // Extend the Electron API with our custom methods
  interface ElectronAPI {
    /** Subscribe for as-many-times-as-needed events */
    on: (
      channel: string,
      listener: (evt: IpcRendererEvent, ...args: unknown[]) => void
    ) => void;
    /** Subscribe for one-shot events */
    once: (
      channel: string,
      listener: (evt: IpcRendererEvent, ...args: unknown[]) => void
    ) => void;
    /** Invoke/await pattern */
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;

    /* high-level helpers */
    openAuxWindows: () => void;
    closeAuxWindows: () => void;
    updateTheme: (darkMode: boolean) => void;
    onUpdateTheme: (callback: (darkMode: boolean) => void) => void;

    /* tiny utility that shows the effective build mode */
    env: { NODE_ENV: string | undefined };
  }

  // Used in Renderer process, expose in `preload.ts`
  interface Window {
    electronAPI: ElectronAPI;
  }
}
