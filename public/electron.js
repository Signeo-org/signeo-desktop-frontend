// public/electron.js
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

let mainWindow;
let signWindow;
let subtitleWindow;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false,
      nodeIntegration: true,
    },
    minHeight: 600,
    minWidth: 800,
  });

  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`;
  mainWindow.loadURL(startUrl);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.on("closed", () => {
    if (signWindow) {
      signWindow.close();
    }
    if (subtitleWindow) {
      subtitleWindow.close();
    }
    mainWindow = null;
  });
}

function createSignWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;
  const width = 400;
  const height = 300;
  signWindow = new BrowserWindow({
    width: width,
    height: height,
    y: 0,
    x: screenWidth - width - 10,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const signUrl = isDev
    ? "http://localhost:3000/sign"
    : `file://${path.join(__dirname, "../build/index.html#/sign")}`;
  signWindow.loadURL(signUrl);
  signWindow.setMenuBarVisibility(false);
  signWindow.on("closed", () => (signWindow = null));
}

function createSubtitleWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;
  const width = 1000;
  const height = 100;

  subtitleWindow = new BrowserWindow({
    width: width,
    height: height,
    x: screenWidth / 4 - 120,
    y: screenHeight - height - 10,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const subtitleUrl = isDev
    ? "http://localhost:3000/subtitle"
    : `file://${path.join(__dirname, "../build/index.html#/subtitle")}`;
  subtitleWindow.loadURL(subtitleUrl);
  subtitleWindow.setMenuBarVisibility(false);
  subtitleWindow.on("closed", () => (subtitleWindow = null));
}

app.whenReady().then(() => {
  createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

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
