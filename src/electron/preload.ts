import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

export interface AudioDevice {
  index: number;
  name: string;
  channels: number;
  sample_rate: number;
  is_default: boolean;
}

export type SignMediaItem = {
  label: string;
  originalName: string;
  ext: ".mp4" | ".gif";
  addedAtUtc: string;
};

export interface ElectronAPI {
  on: (channel: string, listener: (evt: IpcRendererEvent, ...args: unknown[]) => void) => void;
  once: (channel: string, listener: (evt: IpcRendererEvent, ...args: unknown[]) => void) => void;
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;

  openAuxWindows: () => Promise<void>;
  closeAuxWindows: () => Promise<boolean>;
  openWindow: (windowType: "subtitle" | "sign") => Promise<boolean>;

  updateTheme: (darkMode: boolean) => void;
  onUpdateTheme: (callback: (darkMode: boolean) => void) => void;

  launchAudioTool: () => Promise<boolean>;
  stopAudioTool: () => Promise<boolean>;
  onTranscriptionOutput: (
    callback: (data: { text: string; type: "partial" | "final" }) => void
  ) => void;

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
  getWordPicturePath: (word: string) => Promise<string>;
  getDatabaseStat: () => Promise<string[]>;

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

  env: { NODE_ENV: string | undefined };
}

const transcriptionCallbacks: ((data: { text: string; type: "partial" | "final" }) => void)[] = [];
const transcriptionBacklog: { text: string; type: "partial" | "final" }[] = [];
const deviceListCallbacks: ((devices: AudioDevice[]) => void)[] = [];

// Handle streaming transcription
ipcRenderer.on(
  "transcription-output",
  (_event, data: { text: string; type: "partial" | "final" }) => {
    if (transcriptionCallbacks.length === 0) {
      transcriptionBacklog.push(data);
    } else {
      transcriptionCallbacks.forEach((cb) => cb(data));
    }
  }
);

const api: ElectronAPI = {
  on: (ch, fn) => ipcRenderer.on(ch, fn),
  once: (ch, fn) => ipcRenderer.once(ch, fn),
  invoke: (ch, ...a) => ipcRenderer.invoke(ch, ...a),

  reportSubtitleSize: (size) => ipcRenderer.send("subtitle-size", size),

  getResourcesPath: () => process.resourcesPath,

  resolveSLPath: (word: string) => {
    if (process.env.NODE_ENV === "development") {
      return `../../resources/SL/${word}/shortest.mp4`;
    } else {
      return `${process.resourcesPath}/SL/${word}/shortest.mp4`;
    }
  },

  getSignVideoPath: (word: string) =>
    ipcRenderer.invoke("resolve-sign-video-path", word).then((r) => r as string),

  getWordPicturePath: (word: string) =>
    ipcRenderer.invoke("resolve-word-picture-path", word).then((r) => r as string),

  // ✅ FIX: use invoke, not send (because main uses ipcMain.handle)
  openAuxWindows: async () => {
    await ipcRenderer.invoke("toggle-sign-window", true);
    await ipcRenderer.invoke("toggle-subtitle-window", true);
  },

  closeAuxWindows: () => ipcRenderer.invoke("closeAuxWindows"),
  openWindow: (windowType) => ipcRenderer.invoke("openWindow", windowType),

  updateTheme: (darkMode: boolean) => {
    ipcRenderer.send("update-theme", darkMode);
  },

  onUpdateTheme: (callback) => {
    ipcRenderer.on("theme-updated", (_evt, darkMode: boolean) => callback(darkMode));
  },

  launchAudioTool: () =>
    ipcRenderer
      .invoke("launch-audio-tool")
      .then(() => true)
      .catch((err) => {
        console.error("[0] [ERROR]: Failed to launch signeo-core:", err);
        return false;
      }),

  stopAudioTool: () =>
    ipcRenderer
      .invoke("stop-audio-tool")
      .then(() => true)
      .catch((err) => {
        console.error("[0] [ERROR]: Failed to stop signeo-core:", err);
        return false;
      }),

  onTranscriptionOutput: (callback) => {
    transcriptionCallbacks.push(callback);
    while (transcriptionBacklog.length > 0) {
      const msg = transcriptionBacklog.shift();
      if (msg) callback(msg);
    }
  },

  getAudioDevices: () => {
    ipcRenderer.send("request-device-list");
  },

  onAudioDeviceList: (callback) => {
    deviceListCallbacks.push(callback);

    const wrappedCallback = (_event: IpcRendererEvent, devices: AudioDevice[]) => {
      callback(devices);
    };

    ipcRenderer.on("device-list", wrappedCallback);

    return () => {
      const index = deviceListCallbacks.indexOf(callback);
      if (index !== -1) deviceListCallbacks.splice(index, 1);
      ipcRenderer.off("device-list", wrappedCallback);
    };
  },

  offAudioDeviceList: (callback) => {
    const index = deviceListCallbacks.indexOf(callback);
    if (index !== -1) deviceListCallbacks.splice(index, 1);

    const wrappedCallback = (_event: IpcRendererEvent, devices: AudioDevice[]) => {
      callback(devices);
    };
    ipcRenderer.off("device-list", wrappedCallback);
  },

  selectAudioDevice: (index) => ipcRenderer.invoke("select-audio-device", index),

  toggleSignWindow: (show) => ipcRenderer.invoke("toggle-sign-window", show),
  toggleSubtitleWindow: (show) => ipcRenderer.invoke("toggle-subtitle-window", show),

  getDatabaseStat: () => ipcRenderer.invoke("get-database-stat"),

  // Custom signs
  importSignMediaPick: () => ipcRenderer.invoke("import-sign-media"),
  saveSignMedia: (src, label) => ipcRenderer.invoke("save-sign-media", { src, label }),
  listSignMedia: () => ipcRenderer.invoke("list-sign-media"),
  removeSignMedia: (label) => ipcRenderer.invoke("remove-sign-media", { label }),

  env: { NODE_ENV: process.env.NODE_ENV },
};

contextBridge.exposeInMainWorld("electronAPI", api);
