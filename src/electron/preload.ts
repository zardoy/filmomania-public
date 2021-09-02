import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    ipcRenderer: {
        ...ipcRenderer,
        // TODO remove that usage from SettingsStore
        on: ipcRenderer.on,
        addListener: ipcRenderer.addListener,
        removeListener: ipcRenderer.removeListener,
        removeAllListeners: ipcRenderer.removeAllListeners,
    }
});

// ???
contextBridge.exposeInMainWorld("process", {
    type: "renderer"
});
