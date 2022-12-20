import "./handleErrors";

// todo-high electron-reloader
import { app } from "electron";
import electronDebug from "electron-debug";

import { bindIPC } from "./ipc";
import { createMainWindow, mainWindow } from "./mainWindow";
import { settingsStore } from "../react/electron-shared/settings";
import electronIsDev from "electron-is-dev";

electronDebug({
    showDevTools: false
});

export const debug = console.log;

if (electronIsDev) {
    app.commandLine.appendSwitch("remote-debugging-port", "8315")
}

const loadApp = async () => {
    app.setName("FilmoMania Beta");
    bindIPC();
    await settingsStore.init();
    createMainWindow();
    settingsStore.windowIpcMain = mainWindow!
};

app.on("ready", loadApp);
