import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Audio device object with actual backend index
export interface AudioDevice {
  index: number;       // Actual backend device index
  name: string;        // Display name
  channels: number;
  sample_rate: number;
  is_default: boolean;
}

export interface ElectronAPI {
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
  closeAuxWindows: () => Promise<boolean>;
  openWindow: (windowType: "subtitle" | "sign") => Promise<boolean>;
  updateTheme: (darkMode: boolean) => void;
  onUpdateTheme: (callback: (darkMode: boolean) => void) => void;
  launchAudioTool: () => Promise<boolean>;
  stopAudioTool: () => Promise<boolean>;
  onTranscriptionOutput: (callback: (data: { text: string; type: "partial" | "final" }) => void) => void;
  getAudioDevices: () => void;
  selectAudioDevice: (index: number) => Promise<boolean>;
  onAudioDeviceList: (callback: (devices: AudioDevice[]) => void) => () => void;
  offAudioDeviceList: (callback: (devices: AudioDevice[]) => void) => void;
  toggleSignWindow: (show: boolean) => Promise<boolean>;
  toggleSubtitleWindow: (show: boolean) => Promise<boolean>;
  reportSubtitleSize: (size: { width: number; height: number }) => void;
  getResourcesPath: () => string;
  resolveSLPath: (word: string) => string;
  getSignVideoPath: (word: string) => Promise<string>;
  getDatabaseStat: () => Promise<string[]>;

  /* tiny utility that shows the effective build mode */
  env: { NODE_ENV: string | undefined };
}

const transcriptionCallbacks: ((data: { text: string; type: "partial" | "final" }) => void)[] = [];
const transcriptionBacklog: { text: string; type: "partial" | "final" }[] = [];
const deviceListCallbacks: ((devices: AudioDevice[]) => void)[] = [];

// Handle streaming transcription
ipcRenderer.on("transcription-output", (_event, data: { text: string; type: "partial" | "final" }) => {
  if (transcriptionCallbacks.length === 0) {
    transcriptionBacklog.push(data);
  } else {
    transcriptionCallbacks.forEach((cb) => cb(data));
  }
});

const api: ElectronAPI = {
  // ... existing methods ...
  on: (ch, fn) => ipcRenderer.on(ch, fn),
  once: (ch, fn) => ipcRenderer.once(ch, fn),
  invoke: (ch, ...a) => ipcRenderer.invoke(ch, ...a),

  reportSubtitleSize: (size) => ipcRenderer.send("subtitle-size", size),

  getResourcesPath: () => process.resourcesPath,

  // find the path to a sign language video for a given word
  // use one path for development, another for production
  // Deprecated: use getSignVideoPath instead for correct absolute path
  resolveSLPath: (word: string) => {
    if (process.env.NODE_ENV === "development") {
      return `../../resources/SL/${word}/shortest.mp4`;
    } else {
      return `${process.resourcesPath}/SL/${word}/shortest.mp4`;
    }
  },

  // New: get the correct absolute file:// path from main process
  getSignVideoPath: (word: string) =>
    ipcRenderer.invoke("resolve-sign-video-path", word).then((result) => result as string),

  openAuxWindows: () => {
    ipcRenderer.send("toggle-sign-window", true);
    ipcRenderer.send("toggle-subtitle-window", true);
  },
  closeAuxWindows: () => ipcRenderer.invoke("closeAuxWindows"),
  openWindow: (windowType) => ipcRenderer.invoke("openWindow", windowType),

  updateTheme: (darkMode: boolean) => {
    ipcRenderer.send("update-theme", darkMode);
  },

  onUpdateTheme: (callback) => {
    ipcRenderer.on("theme-updated", (_, darkMode: boolean) => {
      callback(darkMode);
    });
  },

  launchAudioTool: () => {
    return ipcRenderer
      .invoke("launch-audio-tool")
      .then(() => true)
      .catch((err) => {
        console.error("[0] [ERROR]: Failed to launch signeo-core:", err);
        return false;
      });
  },

  stopAudioTool: () => {
    return ipcRenderer
      .invoke("stop-audio-tool")
      .then(() => true)
      .catch((err) => {
        console.error("[0] [ERROR]: Failed to stop signeo-core:", err);
        return false;
      });
  },

  onTranscriptionOutput: (callback) => {
    console.log("[0]: onTranscriptionOutput subscribed");

    transcriptionCallbacks.push(callback);
    while (transcriptionBacklog.length > 0) {
      const message = transcriptionBacklog.shift();
      if (message) callback(message);
    }
  },

  getAudioDevices: () => {
    ipcRenderer.send("request-device-list"); // this re-triggers list
  },

  onAudioDeviceList: (callback) => {
    deviceListCallbacks.push(callback);
    // Create a properly typed wrapper function that matches ipcRenderer's expected signature
    const wrappedCallback = (_event: IpcRendererEvent, devices: AudioDevice[]) => {
      callback(devices);
    };
    ipcRenderer.on("device-list", wrappedCallback);

    // Return a function to remove this specific listener
    return () => {
      const index = deviceListCallbacks.indexOf(callback);
      if (index !== -1) {
        deviceListCallbacks.splice(index, 1);
      }
      ipcRenderer.off("device-list", wrappedCallback);
    };
  },

  offAudioDeviceList: (callback) => {
    const index = deviceListCallbacks.indexOf(callback);
    if (index !== -1) {
      deviceListCallbacks.splice(index, 1);
    }
    // Create a properly typed wrapper function that matches ipcRenderer's expected signature
    const wrappedCallback = (_event: IpcRendererEvent, devices: AudioDevice[]) => {
      callback(devices);
    };
    ipcRenderer.off("device-list", wrappedCallback);
  },

  selectAudioDevice: (index) =>
    ipcRenderer.invoke("select-audio-device", index),

  toggleSignWindow: (show) =>
    ipcRenderer.invoke("toggle-sign-window", show),

  toggleSubtitleWindow: (show) =>
    ipcRenderer.invoke("toggle-subtitle-window", show),

  getDatabaseStat: () => ipcRenderer.invoke("get-database-stat"),

  env: { NODE_ENV: process.env.NODE_ENV },
};

contextBridge.exposeInMainWorld("electronAPI", api);
