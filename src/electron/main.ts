import { app, BrowserWindow, ipcMain, screen, shell } from "electron";
import Store from "electron-store";
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
    console.log("Loading production index.html from:", indexPath);
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error("Failed to load index.html:", err);
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

ipcMain.on("toggle-sign-window", (event, arg) => {
  if (arg) {
    if (!signWindow) {
      createSignWindow();
    }
  } else {
    if (signWindow) {
      signWindow.close();
    }
  }
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
ipcMain.handle('openWindow', async (event, windowType: 'subtitle' | 'sign') => {
  try {
    if (windowType === 'subtitle' && !subtitleWindow) {
      createSubtitleWindow();
      return true;
    } else if (windowType === 'sign' && !signWindow) {
      createSignWindow();
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error opening ${windowType} window:`, error);
    throw new Error(`Failed to open ${windowType} window`);
  }
});

// Handle closing all auxiliary windows
ipcMain.handle('closeAuxWindows', async () => {
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
    console.error('Error closing auxiliary windows:', error);
    throw new Error('Failed to close auxiliary windows');
  }
});
