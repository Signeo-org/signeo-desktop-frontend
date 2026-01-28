import { IpcRendererEvent } from "electron";

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

export { }; // Make this a module

// Audio device object with actual backend index
export interface AudioDevice {
  index: number;       // Actual backend device index
  name: string;        // Display name
  channels: number;
  sample_rate: number;
  is_default: boolean;
}

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
    openAuxWindows: () => void;
    closeAuxWindows: () => Promise<boolean>;
    openWindow: (windowType: "subtitle" | "sign") => Promise<boolean>;

    /* Theme */
    updateTheme: (darkMode: boolean) => void;
    onUpdateTheme: (callback: (darkMode: boolean) => void) => void;

    /* Audio tool */
    launchAudioTool: () => Promise<boolean>;
    stopAudioTool: () => Promise<boolean>;
    onTranscriptionOutput: (callback: (text: string) => void) => void;

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

    /* Environment */
    env: { NODE_ENV: string | undefined };
  }

  // Used in Renderer process, expose in `preload.ts`
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
