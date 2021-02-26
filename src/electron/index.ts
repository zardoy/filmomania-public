import "./handleErrors";

// todo-high electron-reloader
import { app } from "electron";
import electronDebug from "electron-debug";

import { bindIPC } from "./ipc";
import { createMainWindow } from "./mainWindow";

electronDebug();

export const debug = console.log;

const loadApp = () => {
    bindIPC();
    createMainWindow();
};

app.on("ready", loadApp);
