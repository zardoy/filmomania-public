import "./handleErrors";

// todo-high electron-reloader
import { app, } from "electron";
import electronDebug from "electron-debug";

import { bindIPC } from "./ipc";
import { createMainWindow, mainWindow } from "./mainWindow";
import { settingsStore } from "../react/electron-shared/settings";
import electronIsDev from "electron-is-dev";
import { registerProtocol } from "./protocol";

electronDebug({
    showDevTools: false
});

export const debug = console.log;

if (electronIsDev) {
    app.commandLine.appendSwitch("remote-debugging-port", "8315")
}

// registerProtocol()

const loadApp = async () => {
    app.setName("FilmoMania Beta");
    bindIPC();
    // await new Promise(resolve => {
    //     setTimeout(resolve, 1000)
    // })
    await settingsStore.init();
    createMainWindow();
    settingsStore.windowIpcMain = mainWindow!
};

app.on("ready", loadApp);

app.on("window-all-closed", () => {
    // do not close server
    if (settingsStore.settings.builtinStremioServer.enabled) return
    app.quit()
})
