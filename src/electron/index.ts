import "./handleErrors";

// todo-high electron-reloader
import { app } from "electron";
import electronDebug from "electron-debug";

import { bindIPC } from "./ipc";
import { createMainWindow } from "./mainWindow";
import { settingsStore } from "../react/electron-shared/settings";

// electronDebug({
//     showDevTools: true
// });

export const debug = console.log;

app.commandLine.appendSwitch("remote-debugging-port", "8315")

const loadApp = async () => {
    app.setName("FilmoMania Beta");
    bindIPC();
    await settingsStore.init();
    createMainWindow();
};

app.on("ready", loadApp);
