import "./handleErrors";

import { app } from "electron";
import electronDebug from "electron-debug";

import { bindIPC } from "./ipc";
import { createMainWindow, mainWindow } from "./mainWindow";
import { settingsStore } from "../react/electron-shared/settings";
import electronIsDev from "electron-is-dev";
import { registerProtocol } from "./protocol";
import { SettingsStore } from "../lib/electron-settings";
import killPort from "kill-port"
import { initHooksFile } from "./hooksFile";
import { startRemoteServer } from "./remoteUiControl";

const locked = app.requestSingleInstanceLock()
if (!locked) app.quit()

electronDebug({
    showDevTools: false,
    // todo enable in both
    isEnabled: !electronIsDev
});

export const debug = console.log;

if (electronIsDev) {
    console.clear()
    app.commandLine.appendSwitch("remote-debugging-port", "8315")
}

const loadApp = async () => {
    if (!locked) return
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
    registerProtocol()
    if (electronIsDev) {
        // todo resolve root issue instead of that workaround
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        if (settingsStore.settings.builtinStremioServer.enabled && settingsStore.settings.player.stremioServerUrl === "http://127.0.0.1:11470") await killPort(11470).catch(() => {})
    }
    createMainWindow();
    settingsStore.windowIpcMain = mainWindow!
    void startRemoteServer()
};

app.on("ready", loadApp);

app.on("window-all-closed", () => {
    app.quit()
})
