import { app, BrowserWindow, ipcMain, screen, shell } from "electron";
import Store from "electron-store";
import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Initialize store for persistent settings
interface StoreType {
  darkMode: boolean;
}

const store = new Store<StoreType>({
  defaults: {
    darkMode: true,
  },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // ESM-safe

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist/electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "renderer");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null;

function getIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico") // outside ASAR
    : path.join(__dirname, "../assets/icon/test.ico");
}

// Track all windows
const allWindows = new Set<BrowserWindow>();

// Helper function to safely add window to tracking
const trackWindow = (win: BrowserWindow | null) => {
  if (!win) return win;
  allWindows.add(win);
  win.on("closed", () => {
    allWindows.delete(win);
  });
  return win;
};

function createWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  // Get saved theme
  const darkMode = store.get("darkMode", true) as boolean;

  mainWindow = new BrowserWindow({
    icon: getIconPath(),
    width: screenWidth,
    height: screenHeight,
    show: false, // Don't show the window until it's ready
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      // leave sandbox off unless you really need it:
      // sandbox: true,
    },
  });

  // Maximize the window and show it when it's ready to be shown
  mainWindow.once("ready-to-show", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.maximize();
      mainWindow.show();
    }
  });

  // Track window and set up theme handling
  if (mainWindow) {
    trackWindow(mainWindow);
    mainWindow.on("closed", () => {
      mainWindow = null;
    });

    // Send initial theme
    mainWindow.webContents.on("did-finish-load", () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("theme-updated", darkMode);
      }
    });
  }

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // In production, we need to use a different path
    const indexPath = path.join(RENDERER_DIST, "index.html");
    console.log("[0]: Loading production index.html from:", indexPath);
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error("[0] [ERROR]: Failed to load index.html:", err);
    });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    mainWindow = null;
  }
});

app.on("will-quit", () => {
  if (transcriptionProcess) {
    transcriptionProcess.kill();
    transcriptionProcess = null;
  }
});

// Broadcast theme to all windows
const broadcastTheme = (darkMode: boolean) => {
  allWindows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send("theme-updated", darkMode);
    }
  });
};

// Handle theme updates from renderer
ipcMain.on("update-theme", (event, darkMode: boolean) => {
  store.set("darkMode", darkMode);
  broadcastTheme(darkMode);
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

let signWindow: BrowserWindow | null;

function createSignWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;
  const signWidth = 400;
  const signHeight = 300;
  signWindow = new BrowserWindow({
    parent: mainWindow,
    icon: getIconPath(),
    width: signWidth,
    height: signHeight,
    y: 0,
    x: screenWidth - signWidth - 10,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      // leave sandbox off unless you really need it:
      // sandbox: true,
    },
  });
  const signUrl = VITE_DEV_SERVER_URL
    ? "http://localhost:5173/#/sign"
    : `file://${path.posix.join(
        ...RENDERER_DIST.split(path.sep),
        "index.html"
      )}#/sign`;
  signWindow.loadURL(signUrl);
  signWindow.setMenuBarVisibility(false);
  if (signWindow) {
    trackWindow(signWindow);
    signWindow.on("closed", () => {
      signWindow = null;
    });

    // Send initial theme
    const darkMode = store.get("darkMode", true);
    signWindow.webContents.on("did-finish-load", () => {
      if (signWindow && !signWindow.isDestroyed()) {
        signWindow.webContents.send("theme-updated", darkMode);
      }
    });
  }
}

ipcMain.handle("toggle-sign-window", async (event, shouldShow: boolean) => {
  if (shouldShow) {
    if (!signWindow || signWindow.isDestroyed()) {
      createSignWindow();
      return true;
    }
  } else {
    if (signWindow && !signWindow.isDestroyed()) {
      signWindow.close();
      signWindow = null;
      return true;
    }
  }
  return false;
});

// Toggle subtitle window
ipcMain.handle('toggle-subtitle-window', async (event, shouldShow: boolean) => {
  if (shouldShow) {
    if (!subtitleWindow || subtitleWindow.isDestroyed()) {
      createSubtitleWindow();
      return true;
    }
  } else {
    if (subtitleWindow && !subtitleWindow.isDestroyed()) {
      subtitleWindow.close();
      subtitleWindow = null;
      return true;
    }
  }
  return false;
});

let subtitleWindow: BrowserWindow | null;

function createSubtitleWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;
  const subtitleWidth = 1000;
  const subtitleHeight = 100;
  subtitleWindow = new BrowserWindow({
    parent: mainWindow,
    icon: getIconPath(),
    width: subtitleWidth,
    height: subtitleHeight,
    y: screenHeight - subtitleHeight - 10,
    // center based on subtitle with and the screen width
    x: (screenWidth - subtitleWidth) / 2,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      // leave sandbox off unless you really need it:
      // sandbox: true,
    },
  });
  const subtitleUrl = VITE_DEV_SERVER_URL
    ? "http://localhost:5173/#/subtitle"
    : `file://${path.posix.join(
        ...RENDERER_DIST.split(path.sep),
        "index.html"
      )}#/subtitle`;
  subtitleWindow.loadURL(subtitleUrl);
  subtitleWindow.setMenuBarVisibility(false);
  if (subtitleWindow) {
    trackWindow(subtitleWindow);
    subtitleWindow.on("closed", () => {
      subtitleWindow = null;
    });

    // Send initial theme
    const darkMode = store.get("darkMode", true);
    subtitleWindow.webContents.on("did-finish-load", () => {
      if (subtitleWindow && !subtitleWindow.isDestroyed()) {
        subtitleWindow.webContents.send("theme-updated", darkMode);
      }
    });
  }
}

ipcMain.on("toggle-subtitle-window", (event, arg) => {
  if (arg) {
    if (!subtitleWindow) {
      createSubtitleWindow();
    }
  } else {
    if (subtitleWindow) {
      subtitleWindow.close();
    }
  }
});

// Handle window opening based on type
ipcMain.handle("openWindow", async (event, windowType: "subtitle" | "sign") => {
  try {
    if (windowType === "subtitle" && !subtitleWindow) {
      createSubtitleWindow();
      return true;
    } else if (windowType === "sign" && !signWindow) {
      createSignWindow();
      return true;
    }
    return false;
  } catch (error) {
    console.error("[0] [ERROR]: Error opening ${windowType} window:", error);
    throw new Error(`Failed to open ${windowType} window`);
  }
});

// Handle closing all auxiliary windows
ipcMain.handle("closeAuxWindows", async () => {
  try {
    if (subtitleWindow) {
      subtitleWindow.close();
      subtitleWindow = null;
    }
    if (signWindow) {
      signWindow.close();
      signWindow = null;
    }
    return true;
  } catch (error) {
    console.error("[0] [ERROR]: Error closing auxiliary windows:", error);
    throw new Error("Failed to close auxiliary windows");
  }
});

let transcriptionProcess: ReturnType<typeof spawn> | null = null;
let currentWebContents: Electron.WebContents | null = null;
let isLaunching = false;
let isToolRunning = false;

ipcMain.handle("launch-audio-tool", async (event) => {
  // If already running, just return success
  if (isToolRunning) {
    console.log("[0]: Transcription tool is already running.");
    return true;
  }

  // Prevent multiple concurrent launches
  if (isLaunching) {
    console.log("[0]: Tool launch already in progress");
    return false;
  }

  isLaunching = true;
  isToolRunning = true;
  
  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, "resources/AudioTranscriptionTool.exe")
    : path.join(__dirname, "../../resources/AudioTranscriptionTool.exe");
  
  console.log("[0]: Launching tool at:", exePath);

  try {
    const process = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Store the process reference
    transcriptionProcess = process;
    currentWebContents = event.sender;
    let buffer = "";
    let deviceIndexSent = false;

    // Set up event handlers
    const onError = (err) => {
      console.error('[0] [ERROR]: Transcription tool error:', err);
      cleanupProcess();
    };

    const onExit = (code, signal) => {
      console.log(`[0]: Transcription tool exited with code ${code} and signal ${signal}`);
      isToolRunning = false;
      cleanupProcess();
    };

    const onStdout = (data) => {
      const raw = data.toString();
      const formatted = raw
        .split(/\r?\n/)
        .map((line) => `[1]: ${line}`)
        .join("\n");
      
      console.log(formatted);
      buffer += formatted;
      
      // Send output to all windows
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send("transcription-output", formatted);
        }
      });

      // Handle device selection prompt
      if (/Enter the index.*Press ENTER to stop/i.test(formatted) && !deviceIndexSent) {
        deviceIndexSent = true;
        console.log("[0]: Prompt detected. Sending index in 500ms...");
        setTimeout(() => {
          if (process.stdin.writable) {
            process.stdin.write("12\n");
          }
        }, 500);
      }

      // Send device list to renderer
      const deviceLines = buffer.match(/\[\d+\] .+\[Input\]/g);
      if (deviceLines && currentWebContents) {
        currentWebContents.send("device-list", deviceLines);
      }
    };

    const onStderr = (err) => {
      const raw = err.toString();
      const formatted = raw
        .split(/\r?\n/)
        .map((line) => `[1] [ERROR]: ${line}`)
        .join("\n");
      console.error(formatted);
    };

    // Attach event listeners
    process.on('error', onError);
    process.on('exit', onExit);
    process.stdout.on("data", onStdout);
    process.stderr.on("data", onStderr);

    // Return a cleanup function to remove listeners when the process ends
    const cleanup = () => {
      process.off('error', onError);
      process.off('exit', onExit);
      process.stdout.off("data", onStdout);
      process.stderr.off("data", onStderr);
    };

    process.once('exit', cleanup);
    process.once('error', cleanup);

    return true;
  } catch (error) {
    console.error("[0] [ERROR]: Error launching transcription tool:", error);
    cleanupProcess();
    return false;
  } finally {
    isLaunching = false;
  }
});

// Handle stop-audio-tool IPC call
ipcMain.handle("stop-audio-tool", async () => {
  console.log("[0]: Stopping transcription tool...");
  return cleanupProcess();
});

// Helper function to clean up process references
function cleanupProcess() {
  if (transcriptionProcess) {
    try {
      if (!transcriptionProcess.killed) {
        transcriptionProcess.kill();
      }
      return true;
    } catch (error) {
      console.error("[0] [ERROR]: Error stopping transcription tool:", error);
      return false;
    } finally {
      transcriptionProcess = null;
      currentWebContents = null;
      isToolRunning = false;
    }
  }
  isToolRunning = false;
  return true;
}

ipcMain.handle("select-audio-device", (event, index: number) => {
  if (!transcriptionProcess || !transcriptionProcess.stdin || !transcriptionProcess.stdin.writable) {
    console.error('[0] [ERROR]: No active transcription process or stdin not writable');
    return false;
  }
  
  try {
    transcriptionProcess.stdin.write(`${index}\n`);
    return true;
  } catch (error) {
    console.error('[0] [ERROR]: Failed to write to transcription process:', error);
    cleanupProcess();
    return false;
  }
});


