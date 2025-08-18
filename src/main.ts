import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { updateElectronApp } from 'update-electron-app';
import env from '../env.json';
import { windowControl } from './ipcMain/windowControl';
import { BrowserControl } from './ipcMain/BrowserControl';
import Store from 'electron-store';
import LocaStorage from './ipcMain/LocalStorage';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}
updateElectronApp({
  repo: env.githubRepo,
});
const store = new Store();
export const localStorage = new LocaStorage(store);

let browserControl: BrowserControl = null;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
    frame: false,
    icon: 'assets/icons/icon.png',
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  windowControl(mainWindow);
  browserControl = new BrowserControl(mainWindow);
  // Open the DevTools.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// Khi app đóng
app.on('before-quit', async () => {
  await browserControl.cleanup();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});
