// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    invoke(channel: string, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
    send(channel: string, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: string, listener: (...args: unknown[]) => void) {
      ipcRenderer.on(channel, (_event, ...args) => listener(...args));
    },
    removeListener(channel: string, listener: (...args: unknown[]) => void) {
      ipcRenderer.removeListener(channel, listener);
    },
  },
});

declare global {
  interface Window {
    electronAPI: {
      ipcRenderer: {
        invoke(channel: string, ...args: unknown[]): Promise<unknown>;
        send(channel: string, ...args: unknown[]): void;
        on(channel: string, listener: (...args: unknown[]) => void): void;
        removeListener(
          channel: string,
          listener: (...args: unknown[]) => void
        ): void;
      };
    };
  }
}
