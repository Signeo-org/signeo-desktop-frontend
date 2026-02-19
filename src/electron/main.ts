import { app, BrowserWindow, ipcMain, screen, shell, dialog } from "electron";
import Store from "electron-store";
import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "fs";

// ========================= STORE =========================
interface StoreType {
  darkMode: boolean;

  // key = normalized label
  signMediaIndex: Record<
    string,
    {
      label: string;        // normalized label
      originalName: string; // original filename
      ext: ".mp4" | ".gif";
      addedAtUtc: string;   // ISO UTC
    }
  >;
}

const store = new Store<StoreType>({
  defaults: {
    darkMode: true,
    signMediaIndex: {},
  },
});

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
  if (args.some((a) => typeof a === "string" && a.includes("SetApplicationIsDaemon"))) {
    return; // suppress this specific macOS sandbox warning
  }
  originalError.apply(console, args as any);
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
      webSecurity: false,
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

ipcMain.on("update-theme", (_evt, darkMode: boolean) => {
  store.set("darkMode", darkMode);
  broadcastTheme(darkMode);
});

// ========================= SIGN & SUBTITLE WINDOWS =========================
let signWindow: BrowserWindow | null = null;
let subtitleWindow: BrowserWindow | null = null;

function createAuxWindow(type: "sign" | "subtitle") {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
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
      titleBarStyle: "customButtonsOnHover",
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.mjs"),
        contextIsolation: true,
        webSecurity: false,
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
      titleBarStyle: "customButtonsOnHover",
      hasShadow: false,
      focusable: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.mjs"),
        contextIsolation: true,
        webSecurity: false,
      },
    };
  }

  const win = new BrowserWindow(options);

  if (process.platform === "darwin") {
    win.setAlwaysOnTop(true, "screen-saver");
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setFullScreenable(false);
  } else {
    win.setAlwaysOnTop(true, "pop-up-menu");
  }

  // Make overlay click-through
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

  if (type === "subtitle") {
    app.whenReady().then(() => {
      const displays = screen.getAllDisplays();
      const externalDisplay = displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0);
      if (externalDisplay) {
        win.setPosition(externalDisplay.bounds.x + 50, externalDisplay.bounds.y);
      }
    });
  }

  if (type === "sign") signWindow = win;
  else subtitleWindow = win;
}

ipcMain.handle("toggle-sign-window", async (_evt, show: boolean) => {
  if (show && (!signWindow || signWindow.isDestroyed())) createAuxWindow("sign");
  else signWindow?.close();
  return true;
});

ipcMain.handle("toggle-subtitle-window", async (_evt, show: boolean) => {
  if (show && (!subtitleWindow || subtitleWindow.isDestroyed())) createAuxWindow("subtitle");
  else subtitleWindow?.close();
  return true;
});

ipcMain.on("subtitle-size", (_evt, bounds: { width: number; height: number }) => {
  if (subtitleWindow && !subtitleWindow.isDestroyed()) {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    const x = Math.max(0, Math.round((screenWidth - bounds.width) / 2));
    const y = screenHeight - bounds.height - 20;

    subtitleWindow.setBounds({ x, y, width: bounds.width, height: bounds.height });
  }
});

ipcMain.handle("openWindow", async (_evt, type: "sign" | "subtitle") => {
  if (type === "sign" && (!signWindow || signWindow.isDestroyed())) createAuxWindow("sign");
  else if (type === "subtitle" && (!subtitleWindow || subtitleWindow.isDestroyed()))
    createAuxWindow("subtitle");
  return true;
});

ipcMain.handle("closeAuxWindows", async () => {
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

interface AudioDevice {
  index: number;
  name: string;
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

  let selectedToolPath: string = "";

  if (app.isPackaged) {
    const backendRoot = path.join(process.resourcesPath, "backend");
    try {
      const entries = fs.readdirSync(backendRoot, { withFileTypes: true });
      const dir = entries.find((e) => e.isDirectory());
      if (dir) {
        selectedToolPath = path.join(backendRoot, dir.name, "signeo-core.exe");
      }
    } catch (e) {
      console.error("[0] [ERROR]: Failed to locate backend executable in resources:", e);
    }
  } else {
    const backendBase = path.join(__dirname, "../../../backend");

const candidates = [
  path.join(backendBase, "build", "signeo-core.exe"),
  path.join(backendBase, "build_gpu_try", "signeo-core.exe"),
];

selectedToolPath = candidates.find(p => fs.existsSync(p)) ?? candidates[0];

console.log("[DEV] Tried backend paths:", candidates);
  }

  if (!selectedToolPath || !fs.existsSync(selectedToolPath)) {
    const legacyPath = app.isPackaged
      ? path.join(process.resourcesPath, "backend/signeo-core.exe")
      : path.join(__dirname, "../../../backend/build/signeo-core.exe");

    if (fs.existsSync(legacyPath)) selectedToolPath = legacyPath;
    else {
      console.warn("⚠️ No native binary found at resolved path:", selectedToolPath || "null");
      selectedToolPath = legacyPath;
    }
  }

  console.log("[0]: Launching tool at:", selectedToolPath);

  try {
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

      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() || "";

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
              cachedDeviceList = msg.devices.map((d: any) => ({
                index: d.index,
                name: d.name,
                channels: d.channels,
                sample_rate: d.sample_rate,
                is_default: d.is_default,
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
        } catch {
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

ipcMain.handle("stop-audio-tool", async () => {
  console.log("[0]: Stopping transcription tool...");
  return cleanupProcess();
});

ipcMain.handle("select-audio-device", async (_evt, index: number) => {
  if (!transcriptionProcess?.stdin?.writable) {
    console.error("[0] [ERROR]: stdin not writable");
    return false;
  }
  try {
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

// ========================= CUSTOM SIGN MEDIA (PERSISTENT) =========================
function normalizeLabel(input: string): string {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\/\\]/g, "_") // no subfolders
    .replace(/\s+/g, "_") // spaces -> _
    .replace(/[.,!?;:]+$/g, ""); // trailing punctuation
}

function toFileUrl(p: string): string {
  return `file://${p.replace(/\\/g, "/")}`;
}

function getUserMediaDir(): string {
  return path.join(app.getPath("userData"), "sign_media");
}

function ensureUserMediaDir(): string {
  const dir = getUserMediaDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getSignMediaIndex() {
  return store.get("signMediaIndex", {}) as StoreType["signMediaIndex"];
}
function setSignMediaIndex(next: StoreType["signMediaIndex"]) {
  store.set("signMediaIndex", next);
}

ipcMain.handle("import-sign-media", async () => {
  const result = await dialog.showOpenDialog({
    title: "Select a sign video (MP4) or GIF",
    properties: ["openFile"],
    filters: [
      { name: "Videos / GIF", extensions: ["mp4", "gif"] },
      { name: "All files", extensions: ["*"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { ok: false, canceled: true as const };
  }

  const src = result.filePaths[0];
  const ext = path.extname(src).toLowerCase();
  if (ext !== ".mp4" && ext !== ".gif") {
    return { ok: false, error: "Unsupported file type. Use .mp4 or .gif" };
  }

  return { ok: true, src, ext: ext as ".mp4" | ".gif" };
});

ipcMain.handle("save-sign-media", async (_event, payload: { src: string; label: string }) => {
  const src = payload?.src;
  const labelRaw = payload?.label ?? "";
  const label = normalizeLabel(labelRaw);

  if (!src || !fs.existsSync(src)) return { ok: false, error: "Source file not found" };
  if (!label) return { ok: false, error: "Empty label" };

  const ext = path.extname(src).toLowerCase();
  if (ext !== ".mp4" && ext !== ".gif") {
    return { ok: false, error: "Unsupported file type. Use .mp4 or .gif" };
  }

  const dir = ensureUserMediaDir();
  const dest = path.join(dir, `${label}${ext}`);

  try {
    const replaced = fs.existsSync(dest);
    if (replaced) fs.unlinkSync(dest);
    fs.copyFileSync(src, dest);

    const idx = getSignMediaIndex();
    idx[label] = {
      label,
      originalName: path.basename(src),
      ext: ext as ".mp4" | ".gif",
      addedAtUtc: new Date().toISOString(),
    };
    setSignMediaIndex(idx);

    return { ok: true, label, dest: toFileUrl(dest), replaced };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
});

ipcMain.handle("list-sign-media", async () => {
  try {
    const dir = ensureUserMediaDir();
    const idx = getSignMediaIndex();

    // cleanup entries whose files are missing
    let changed = false;
    for (const [label, meta] of Object.entries(idx)) {
      const filePath = path.join(dir, `${label}${meta.ext}`);
      if (!fs.existsSync(filePath)) {
        delete idx[label];
        changed = true;
      }
    }
    if (changed) setSignMediaIndex(idx);

    const items = Object.values(idx).sort((a, b) => (a.addedAtUtc < b.addedAtUtc ? 1 : -1));
    return { ok: true, items };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
});

ipcMain.handle("remove-sign-media", async (_event, payload: { label: string }) => {
  const label = normalizeLabel(payload?.label ?? "");
  if (!label) return { ok: false, error: "Empty label" };

  try {
    const dir = ensureUserMediaDir();
    const idx = getSignMediaIndex();
    const meta = idx[label];
    if (!meta) return { ok: false, error: "Label not found" };

    const filePath = path.join(dir, `${label}${meta.ext}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    delete idx[label];
    setSignMediaIndex(idx);

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
});

// ========================= SIGN VIDEO PATH RESOLVER =========================
ipcMain.handle("resolve-sign-video-path", async (_event, word: string) => {
  const label = normalizeLabel(word);

  // 1) user-imported media
  const userDir = ensureUserMediaDir();
  const mp4 = path.join(userDir, `${label}.mp4`);
  const gif = path.join(userDir, `${label}.gif`);

  if (fs.existsSync(mp4)) return toFileUrl(mp4);
  if (fs.existsSync(gif)) return toFileUrl(gif);

  // 2) fallback database
  let videoPath: string;
  if (app.isPackaged) {
    videoPath = path.join(process.resourcesPath, "SL", word, "shortest.mp4");
  } else {
    videoPath = path.join(__dirname, "../../../../../shared/database/SL", word, "shortest.mp4");
  }

  return toFileUrl(videoPath);
});

ipcMain.handle("resolve-word-picture-path", async (_event, word: string) => {
  let imgPath: string;
  if (app.isPackaged) {
    imgPath = path.join(process.resourcesPath, "words_picture", `${word}.png`);
  } else {
    imgPath = path.join(__dirname, "../../../../../shared/database/words_picture", `${word}.png`);
  }
  return toFileUrl(imgPath);
});

// ========================= DATABASE STATS =========================
let cachedDBStats: string[] | null = null;

ipcMain.handle("get-database-stat", async () => {
  if (cachedDBStats) return cachedDBStats;

  try {
    let slPath: string;
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
    const words = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    console.log(`[0]: Found ${words.length} words in database.`);
    cachedDBStats = words;
    return words;
  } catch (error) {
    console.error("[0] [ERROR]: Failed to get database stats:", error);
    return [];
  }
});
