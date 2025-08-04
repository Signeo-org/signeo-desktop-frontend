import { app, BrowserWindow, ipcMain, screen, shell } from "electron";
import Store from "electron-store";
import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "fs";
import { execFile } from "child_process";

// Store for settings
interface StoreType {
  darkMode: boolean;
}
const store = new Store<StoreType>({ defaults: { darkMode: true } });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist/electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "renderer");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null;
const allWindows = new Set<BrowserWindow>();

function getIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico")
    : path.join(__dirname, "../assets/icon/test.ico");
}

function trackWindow(win: BrowserWindow | null) {
  if (!win) return;
  allWindows.add(win);
  win.on("closed", () => allWindows.delete(win));
}

const originalError = console.error;
console.error = function (...args) {
  if (args.some(a => typeof a === "string" && a.includes("SetApplicationIsDaemon"))) {
    return; // suppress this specific macOS sandbox warning
  }
  originalError.apply(console, args);
};

// ========================= MAIN WINDOW =========================
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const darkMode = store.get("darkMode", true) as boolean;

  mainWindow = new BrowserWindow({
    icon: getIconPath(),
    width,
    height,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
    },
  });

  mainWindow.once("ready-to-show", async () => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.maximize();
      mainWindow.show();

      try {
        console.log("🚀 Auto-starting audio tool...");
        const handler = (ipcMain as any)._invokeHandlers.get("launch-audio-tool");
        if (handler) {
          // ✅ pass a fake event with a sender
          await handler({ sender: mainWindow.webContents });
          console.log("Audio tool launched successfully.");
        } else {
          console.error("[0] [ERROR]: No handler found for launch-audio-tool");
        }
      } catch (err) {
        console.error("[0] [ERROR]: Failed to auto-start audio tool:", err);
      }
    }
  });


  trackWindow(mainWindow);
  mainWindow.on("closed", () => (mainWindow = null));
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send("theme-updated", darkMode);
  });

  if (VITE_DEV_SERVER_URL) mainWindow.loadURL(VITE_DEV_SERVER_URL);
  else {
    const indexPath = path.join(RENDERER_DIST, "index.html");
    console.log("[0]: Loading production index.html from:", indexPath);
    mainWindow.loadFile(indexPath).catch((err) =>
      console.error("[0] [ERROR]: Failed to load index.html:", err)
    );
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.commandLine.appendSwitch("disable-features", "SystemServices");
app.whenReady().then(createWindow);

// ========================= THEME HANDLING =========================
const broadcastTheme = (darkMode: boolean) => {
  allWindows.forEach((win) => win.webContents.send("theme-updated", darkMode));
};
ipcMain.on("update-theme", (_, darkMode: boolean) => {
  store.set("darkMode", darkMode);
  broadcastTheme(darkMode);
});

// ========================= SIGN & SUBTITLE WINDOWS =========================
let signWindow: BrowserWindow | null = null;
let subtitleWindow: BrowserWindow | null = null;

function createAuxWindow(type: "sign" | "subtitle") {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let options: Electron.BrowserWindowConstructorOptions;

  if (type === "sign") {
    options = {
      parent: mainWindow,
      icon: getIconPath(),
      width: 400,
      height: 300,
      x: width - 410,
      y: 0,
      alwaysOnTop: true,
      frame: false,
      transparent: true,
      webPreferences: { preload: path.join(__dirname, "preload.mjs"), contextIsolation: true },
    };
  } else {
    options = {
      parent: mainWindow,
      icon: getIconPath(),
      width: 1000,
      height: 100,
      x: (width - 1000) / 2,
      y: height - 110,
      alwaysOnTop: true,
      frame: false,
      transparent: true,
      webPreferences: { preload: path.join(__dirname, "preload.mjs"), contextIsolation: true },
    };
  }

  const win = new BrowserWindow(options);
  const url = VITE_DEV_SERVER_URL
    ? `http://localhost:5173/#/${type}`
    : `file://${path.posix.join(...RENDERER_DIST.split(path.sep), "index.html")}#/${type}`;
  win.loadURL(url);
  win.setMenuBarVisibility(false);
  trackWindow(win);

  win.on("closed", () => {
    if (type === "sign") signWindow = null;
    else subtitleWindow = null;
  });

  win.webContents.on("did-finish-load", () => {
    const darkMode = store.get("darkMode", true);
    win.webContents.send("theme-updated", darkMode);
  });

  if (type === "sign") signWindow = win;
  else subtitleWindow = win;
}

ipcMain.handle("toggle-sign-window", (_, show) => {
  if (show && (!signWindow || signWindow.isDestroyed())) createAuxWindow("sign");
  else signWindow?.close();
  return true;
});

ipcMain.handle("toggle-subtitle-window", (_, show) => {
  if (show && (!subtitleWindow || subtitleWindow.isDestroyed())) createAuxWindow("subtitle");
  else subtitleWindow?.close();
  return true;
});

ipcMain.handle("openWindow", (_, type) => {
  if (type === "sign" && !signWindow) createAuxWindow("sign");
  else if (type === "subtitle" && !subtitleWindow) createAuxWindow("subtitle");
  return true;
});

ipcMain.handle("closeAuxWindows", () => {
  signWindow?.close();
  subtitleWindow?.close();
  signWindow = null;
  subtitleWindow = null;
  return true;
});

// ========================= AUDIO TOOL LAUNCHER =========================
let transcriptionProcess: ReturnType<typeof spawn> | null = null;
let currentWebContents: Electron.WebContents | null = null;
let isLaunching = false;
let isToolRunning = false;
let cachedDeviceList: string[] = [];

ipcMain.handle("launch-audio-tool", async (event) => {
  if (isToolRunning) {
    console.log("[0]: Transcription tool is already running.");
    return true;
  }
  if (isLaunching) {
    console.log("[0]: Tool launch already in progress");
    return false;
  }

  isLaunching = true;
  isToolRunning = true;

  const audioToolPathExe = app.isPackaged
    ? path.join(process.resourcesPath, "resources/AudioTranscriptionTool.exe")
    : path.join(__dirname, "../../resources/AudioTranscriptionTool.exe");

  const audioToolPath = app.isPackaged
    ? path.join(process.resourcesPath, "resources/AudioTranscriptionTool")
    : path.join(__dirname, "../../resources/AudioTranscriptionTool");

  let selectedToolPath: string;
  if (process.platform === "win32" && fs.existsSync(audioToolPathExe)) {
    selectedToolPath = audioToolPathExe;
  } else if (fs.existsSync(audioToolPath)) {
    selectedToolPath = audioToolPath;
  } else {
    selectedToolPath = audioToolPathExe;
    console.warn("⚠️ No native binary found, falling back to .exe");
  }

  console.log("[0]: Launching tool at:", selectedToolPath);

  try {
    const child = execFile(selectedToolPath, [], {
      cwd: path.dirname(selectedToolPath),
      stdio: ["pipe", "pipe", "ignore"],
    }); 


    transcriptionProcess = child;
    currentWebContents = event.sender;
    let buffer = "";
    let deviceIndexSent = false;

    const onStdout = (data) => {
      const raw = data.toString();
      const formatted = raw.split(/\r?\n/).filter(Boolean).join("\n");
      console.log(formatted);
      buffer += formatted;

      // ✅ Parse device lines & cache them
      const deviceLines = buffer.match(/\[\d+\] .+/g); // match all devices, not just `[Input]`
      if (deviceLines) {
        cachedDeviceList = deviceLines;
        BrowserWindow.getAllWindows().forEach((win) => {
          if (!win.isDestroyed()) win.webContents.send("device-list", cachedDeviceList);
        });
      }

      // ✅ Forward transcription output to all windows
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send("transcription-output", formatted);
        }
      });
    };

    child.stdout.on("data", onStdout);

    child.stderr.on("data", (data) => {
      const msg = data.toString();
      if (!msg.includes("SetApplicationIsDaemon")) {
        console.error(`[TOOL-ERR]: ${msg}`);
      }
    });

    child.on("error", (err) => {
      console.error("[0] [ERROR]: Transcription tool error:", err);
      cleanupProcess();
    });
    child.on("exit", (code, signal) => {
      console.log(`[0]: Transcription tool exited with code ${code} signal ${signal}`);
      cleanupProcess();
    });

    return true;
  } catch (err) {
    console.error("[0] [ERROR]: Failed to start tool:", err);
    cleanupProcess();
    return false;
  } finally {
    isLaunching = false;
  }
});

ipcMain.handle("stop-audio-tool", () => {
  console.log("[0]: Stopping transcription tool...");
  return cleanupProcess();
});

ipcMain.handle("select-audio-device", (_, index: number) => {
  if (!transcriptionProcess?.stdin?.writable) {
    console.error("[0] [ERROR]: stdin not writable");
    return false;
  }
  try {
    transcriptionProcess.stdin.write(`${index}\n`);
    return true;
  } catch (err) {
    console.error("[0] [ERROR]: Failed to write index:", err);
    cleanupProcess();
    return false;
  }
});

ipcMain.on("request-device-list", (event) => {
  console.log("[0]: Renderer requested device list → sending cached devices");
  event.sender.send("device-list", cachedDeviceList);
});

function cleanupProcess() {
  if (transcriptionProcess) {
    try {
      if (!transcriptionProcess.killed) transcriptionProcess.kill();
    } catch (err) {
      console.error("[0] [ERROR]: Error stopping tool:", err);
    }
    transcriptionProcess = null;
  }
  currentWebContents = null;
  isToolRunning = false;
  return true;
}
