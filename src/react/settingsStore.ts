import { typedIpcRenderer } from "typed-ipc";

import { SettingsStore } from "./electron-shared/settings";

export const settingsStore = new SettingsStore(
    path => typedIpcRenderer.request("getStoredSettingValue", { path }),
    (path, newValue) => typedIpcRenderer.request("setStoredSettingValue", { path, newValue }),
);
