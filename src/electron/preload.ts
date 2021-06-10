import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    ipcRenderer: {
        ...ipcRenderer,
        on: ipcRenderer.on,
        removeListener: ipcRenderer.removeListener,
        removeAllListeners: ipcRenderer.removeAllListeners,
    }
});

// ???
contextBridge.exposeInMainWorld("process", {
    type: "renderer"
});
