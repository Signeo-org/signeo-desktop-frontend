import { IpcRendererEvent } from "electron";

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

export {}; // Make this a module

// Audio device object with actual backend index
export interface AudioDevice {
  index: number; // Actual backend device index
  name: string; // Display name
  channels: number;
  sample_rate: number;
  is_default: boolean;
}

export type SignMediaItem = {
  label: string; // normalized label
  originalName: string; // original filename
  ext: ".mp4" | ".gif";
  addedAtUtc: string; // ISO UTC
};

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

    /* Window controls */
    openAuxWindows: () => Promise<void>;
    closeAuxWindows: () => Promise<boolean>;
    openWindow: (windowType: "subtitle" | "sign") => Promise<boolean>;

    /* Theme */
    updateTheme: (darkMode: boolean) => void;
    onUpdateTheme: (callback: (darkMode: boolean) => void) => void;

    /* Audio tool */
    launchAudioTool: () => Promise<boolean>;
    stopAudioTool: () => Promise<boolean>;
    onTranscriptionOutput: (
      callback: (data: { text: string; type: "partial" | "final" }) => void
    ) => void;

    /* Audio devices */
    getAudioDevices: () => void;
    selectAudioDevice: (index: number) => Promise<boolean>;
    onAudioDeviceList: (callback: (devices: AudioDevice[]) => void) => () => void;
    offAudioDeviceList: (callback: (devices: AudioDevice[]) => void) => void;

    /* Sign window controls */
    toggleSignWindow: (show: boolean) => Promise<boolean>;
    toggleSubtitleWindow: (show: boolean) => Promise<boolean>;
    reportSubtitleSize: (size: { width: number; height: number }) => void;

    /* Resource paths */
    getResourcesPath: () => string;
    resolveSLPath: (word: string) => string;
    getSignVideoPath: (word: string) => Promise<string>;
    getWordPicturePath: (word: string) => Promise<string>;
    getDatabaseStat: () => Promise<string[]>;

    /* Custom sign media (persistant) */
    importSignMediaPick: () => Promise<
      | { ok: true; src: string; ext: ".mp4" | ".gif" }
      | { ok: false; canceled?: true; error?: string }
    >;

    saveSignMedia: (
      src: string,
      label: string
    ) => Promise<
      | { ok: true; label: string; dest: string; replaced: boolean }
      | { ok: false; error: string }
    >;

    listSignMedia: () => Promise<
      | { ok: true; items: SignMediaItem[] }
      | { ok: false; error: string }
    >;

    removeSignMedia: (label: string) => Promise<
      | { ok: true }
      | { ok: false; error: string }
    >;

    /* Environment */
    env: { NODE_ENV: string | undefined };
  }

  // Used in Renderer process, expose in `preload.ts`
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
