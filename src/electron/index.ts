import "./handleErrors";

// todo-high electron-reloader
import { app, screen } from "electron";
import electronDebug from "electron-debug";

import { bindIPC } from "./ipc";
import { createMainWindow, mainWindow } from "./mainWindow";
import { settingsStore } from "../react/electron-shared/settings";
import electronIsDev from "electron-is-dev";
import { registerProtocol } from "./protocol";
import { SettingsStore } from "../lib/electron-settings";
import killPort from "kill-port"
import { initHooksFile } from "./hooksFile";

// electronDebug({
//     showDevTools: false
// });

export const debug = console.log;

if (electronIsDev) {
    console.clear()
    app.commandLine.appendSwitch("remote-debugging-port", "8315")
}

// registerProtocol()

const loadApp = async () => {
    app.setName("FilmoMania Beta");
    bindIPC();
    initHooksFile()
    if (electronIsDev) {
        SettingsStore.settingsDevBaseName = "filmomania"
        // await new Promise(resolve => {
        //     setTimeout(resolve, 1000)
        // })
    }
    await settingsStore.init();
    if (electronIsDev) {
        // todo resolve root issue instead of that workaround
        if (settingsStore.settings.builtinStremioServer.enabled && settingsStore.settings.player.stremioServerUrl === "http://127.0.0.1:11470") await killPort(11470)
    }
    createMainWindow();
    settingsStore.windowIpcMain = mainWindow!
};

app.on("ready", loadApp);

app.on("window-all-closed", () => {
    // do not close server
    if (settingsStore.settings.builtinStremioServer.enabled) return
    app.quit()
})
