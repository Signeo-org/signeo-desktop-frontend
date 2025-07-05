import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

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

  /* audio tool controls */
  startAudioTool: () => Promise<unknown>;
  stopAudioTool: () => Promise<unknown>;
  onTranscriptionLine: (callback: (line: string) => void) => void;

  /* tiny utility that shows the effective build mode */
  env: { NODE_ENV: string | undefined };
}

const api: ElectronAPI = {
  on: (ch, fn) => ipcRenderer.on(ch, fn),
  once: (ch, fn) => ipcRenderer.once(ch, fn),
  invoke: (ch, ...a) => ipcRenderer.invoke(ch, ...a),

  openAuxWindows: () => {
    ipcRenderer.send("toggle-sign-window", true);
    ipcRenderer.send("toggle-subtitle-window", true);
  },
  closeAuxWindows: () => {
    return ipcRenderer.invoke("closeAuxWindows");
  },
  openWindow: (windowType) => {
    return ipcRenderer.invoke("openWindow", windowType);
  },

  updateTheme: (darkMode: boolean) => {
    ipcRenderer.send("update-theme", darkMode);
  },

  onUpdateTheme: (callback: (darkMode: boolean) => void) => {
    ipcRenderer.on("theme-updated", (_, darkMode: boolean) => {
      callback(darkMode);
    });
  },

  // Audio tool start/stop commands
  startAudioTool: () => ipcRenderer.invoke("start-audio-tool"),
  stopAudioTool: () => ipcRenderer.invoke("stop-audio-tool"),

  // Real-time transcription line subscription
  onTranscriptionLine: (callback: (line: string) => void) => {
    ipcRenderer.on("transcription-line", (_, line: string) => {
      callback(line);
    });
  },

  env: { NODE_ENV: process.env.NODE_ENV },
};

contextBridge.exposeInMainWorld("electronAPI", api);
