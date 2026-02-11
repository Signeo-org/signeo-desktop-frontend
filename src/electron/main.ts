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
    : path.join(__dirname, "../assets/Signeo.jpg");
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
    autoHideMenuBar: app.isPackaged,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      webSecurity: false
    },
  });

  if (app.isPackaged) {
    mainWindow.setMenuBarVisibility(false);
  }

  mainWindow.once("ready-to-show", async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

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
      icon: getIconPath(),
      width: 400,
      height: 300,
      x: width - 410,
      y: 0,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      // 🟢 macOS always-on-top across apps
      titleBarStyle: "customButtonsOnHover",
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.mjs"),
        contextIsolation: true,
        webSecurity: false
      },
    };
  } else {
    options = {
      icon: getIconPath(),
      x: 0,
      y: 0,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      // 🟢 macOS always-on-top across apps
      titleBarStyle: "customButtonsOnHover",
      hasShadow: false,
      focusable: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.mjs"),
        contextIsolation: true,
        webSecurity: false
      },
    };
  }

  const win = new BrowserWindow(options);

  // ✅ macOS-specific behavior: stay on top of ALL apps 
  if (process.platform === "darwin") {
    win.setAlwaysOnTop(true, "screen-saver"); // highest floating level 
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setFullScreenable(false);
  }

  // ✅ Windows/Linux: force topmost
  if (process.platform !== "darwin") {
    win.setAlwaysOnTop(true, "pop-up-menu");
  }

  // Make subtitle window click-through
  win.setIgnoreMouseEvents(true, { forward: true });

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

  if (type == "subtitle") {
    app.whenReady().then(() => {
      const displays = screen.getAllDisplays()
      const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0
      })

      if (externalDisplay) {
        win.setPosition(externalDisplay.bounds.x + 50, externalDisplay.bounds.y)
      }
    })
  }

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

ipcMain.on("subtitle-size", (_, bounds: { width: number; height: number }) => {
  if (subtitleWindow && !subtitleWindow.isDestroyed()) {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    const x = Math.max(0, Math.round((screenWidth - bounds.width) / 2));
    const y = screenHeight - bounds.height - 20; // 20px margin from bottom

    subtitleWindow.setBounds({ x, y, width: bounds.width, height: bounds.height });
  }
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
// Store device objects with actual indices from backend
interface AudioDevice {
  index: number;       // Actual backend device index
  name: string;        // Display name (no index prefix)
  channels: number;
  sample_rate: number;
  is_default: boolean;
}
let cachedDeviceList: AudioDevice[] = [];

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

  // Production: electron-builder bundles to resources/backend/{DynamicFolder}/signeo-core.exe
  // Development: read directly from backend/build
  let selectedToolPath: string = "";

  if (app.isPackaged) {
    const backendRoot = path.join(process.resourcesPath, "backend");
    try {
      // Find the first subdirectory in resources/backend (e.g., Signeo-Backend-Win64-GPU)
      const entries = fs.readdirSync(backendRoot, { withFileTypes: true });
      const dir = entries.find(e => e.isDirectory());
      if (dir) {
        selectedToolPath = path.join(backendRoot, dir.name, "signeo-core.exe");
      }
    } catch (e) {
      console.error("[0] [ERROR]: Failed to locate backend executable in resources:", e);
    }
  } else {
    selectedToolPath = path.join(__dirname, "../../../backend/build/signeo-core.exe");
  }

  if (!selectedToolPath || !fs.existsSync(selectedToolPath)) {
    // Fallback or explicit check
    const legacyPath = app.isPackaged
      ? path.join(process.resourcesPath, "backend/signeo-core.exe")
      : path.join(__dirname, "../../../backend/build/signeo-core.exe");

    if (fs.existsSync(legacyPath)) selectedToolPath = legacyPath;
    else {
      console.warn("⚠️ No native binary found at resolved path:", selectedToolPath || "null");
      // Try one last common dev location just in case
      selectedToolPath = legacyPath;
    }
  }

  console.log("[0]: Launching tool at:", selectedToolPath);

  try {
    // Launch backend (defaults to JSON output mode)
    const child = spawn(selectedToolPath, [], {
      cwd: path.dirname(selectedToolPath),
      stdio: ["pipe", "pipe", "pipe"],
    });


    transcriptionProcess = child;
    currentWebContents = event.sender;
    let lineBuffer = "";

    const onStdout = (data: Buffer) => {
      const raw = data.toString("utf8");
      lineBuffer += raw;

      // Process complete lines (NDJSON)
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const msg = JSON.parse(line);
          console.log("[IPC]:", msg.type, msg);

          switch (msg.type) {
            case "ready":
              console.log("✅ Backend ready, version:", msg.version);
              break;

            case "devices":
              // Store device objects with actual indices
              cachedDeviceList = msg.devices.map((d: any) => ({
                index: d.index,
                name: d.name,
                channels: d.channels,
                sample_rate: d.sample_rate,
                is_default: d.is_default
              }));
              BrowserWindow.getAllWindows().forEach((win) => {
                if (!win.isDestroyed()) win.webContents.send("device-list", cachedDeviceList);
              });
              break;

            case "device_selected":
              console.log(`✅ Device selected: [${msg.index}] ${msg.name}`);
              BrowserWindow.getAllWindows().forEach((win) => {
                if (!win.isDestroyed()) win.webContents.send("device-selected", msg);
              });
              break;

            case "partial":
            case "final":
              BrowserWindow.getAllWindows().forEach((win) => {
                if (!win.isDestroyed()) {
                  win.webContents.send("transcription-output", { text: msg.text, type: msg.type });
                }
              });
              break;

            case "status":
              console.log("Status:", msg.state);
              break;

            case "error":
              console.error("Backend error:", msg.code, msg.message);
              break;
          }
        } catch (e) {
          // Not JSON, log as raw output
          console.log("[Backend]:", line);
        }
      }
    };

    child.stdout?.on("data", onStdout);

    child.stderr?.on("data", (data) => {
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
    // Send JSON command for IPC
    const cmd = JSON.stringify({ cmd: "select_device", index });
    transcriptionProcess.stdin.write(`${cmd}\n`);
    console.log("[IPC] Sent:", cmd);
    return true;
  } catch (err) {
    console.error("[0] [ERROR]: Failed to write command:", err);
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

// ========================= SIGN VIDEO PATH RESOLVER =========================
ipcMain.handle("resolve-sign-video-path", (_event, word) => {
  let videoPath;
  if (app.isPackaged) {
    videoPath = path.join(process.resourcesPath, "/SL", word, "shortest.mp4");
  } else {
    // Navigate up from: src/electron/main.ts -> src -> frontend -> desktop -> apps -> signeo-main -> shared
    // __dirname is .../apps/desktop/frontend/dist/electron (in dev build)
    // Wait, in dev mode with Vite, __dirname is .../dist/electron/main.js usually?
    // Let's check the earlier __dirname definition: path.dirname(fileURLToPath(import.meta.url))
    // In Dev: apps/desktop/frontend/dist/electron (compiled) OR src/electron (if ts-node? no, vite builds it)
    // Actually, simply using the relative path from the project root is safest if we can find it.
    // But let's stick to the relative path that was working before but corrected for shared.
    // Previous working: ../../resources/SL (from main.ts?)
    // shared is at: apps/desktop/frontend/../../../../shared/database/SL
    videoPath = path.join(__dirname, "../../../../../shared/database/SL", word, "shortest.mp4");
  }
  // Return as file:// URL for renderer usage
  return `file://${videoPath.replace(/\\/g, '/')}`;
});

ipcMain.handle("resolve-word-picture-path", (_event, word) => {
  let imgPath;
  if (app.isPackaged) {
    imgPath = path.join(process.resourcesPath, "/words_picture", `${word}.png`);
  } else {
    // Adjust relative path to your dev folder
    imgPath = path.join(__dirname, "../../../../../shared/database/words_picture", `${word}.png`);
  }
  return `file://${imgPath.replace(/\\/g, "/")}`;
});


// ========================= DATABASE STATS =========================
// Caching for DB stats to prevent repeated FS reads and log spam
let cachedDBStats: string[] | null = null;

ipcMain.handle("get-database-stat", async () => {
  if (cachedDBStats) {
    return cachedDBStats;
  }

  try {
    let slPath;
    if (app.isPackaged) {
      slPath = path.join(process.resourcesPath, "SL");
    } else {
      slPath = path.join(__dirname, "../../../../../shared/database/SL");
    }

    if (!fs.existsSync(slPath)) {
      console.warn("[0] [WARN]: SL directory not found at:", slPath);
      return [];
    }

    const entries = fs.readdirSync(slPath, { withFileTypes: true });
    // Filter for directories only, as each directory represents a word
    const words = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    console.log(`[0]: Found ${words.length} words in database.`);
    cachedDBStats = words;
    return words;
  } catch (error) {
    console.error("[0] [ERROR]: Failed to get database stats:", error);
    return [];
  }
});
