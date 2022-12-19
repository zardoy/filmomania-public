/// <reference types="vite/client" />

declare const electron: { ipcRenderer: import("electron").IpcRenderer; };

interface ImportMetaEnv {
    VITE_SEARCH_ENGINE_ENDPOINT: string;
    VITE_SEARCH_ENGINE_ENTRY_ENDPOINT: string;
    VITE_SEARCH_ENGINE_API_KEY: string;
}
