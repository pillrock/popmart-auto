import { BrowserWindow, ipcMain } from 'electron';
export const windowControl = (mainWindow: BrowserWindow) => {
  ipcMain.on('window-control', (_: any, action: string) => {
    console.log('Received window control:', action);
    switch (action) {
      case 'minimize':
        mainWindow.minimize();
        break;
      case 'close':
        mainWindow.close();
        break;
    }
  });
};
