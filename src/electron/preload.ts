import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    ipcRenderer: {
        ...ipcRenderer,
        addListener: ipcRenderer.addListener,
        removeListener: ipcRenderer.removeListener,
        removeAllListeners: ipcRenderer.removeAllListeners,
    }
});

// ???
contextBridge.exposeInMainWorld("process", {
    type: "renderer"
});
