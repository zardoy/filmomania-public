import { app } from "electron";

import { bindIPC } from "./ipc";
import { createMainWindow } from "./mainWindow";

export const debug = console.log;

const loadApp = () => {
    bindIPC();
    createMainWindow();
};

app.on("ready", loadApp);
