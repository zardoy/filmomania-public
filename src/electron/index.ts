import "./handleErrors";

// todo-high electron-reloader
import { app } from "electron";

import { bindIPC } from "./ipc";
import { createMainWindow } from "./mainWindow";

// electronDebug({
//     showDevTools: true
// });

process.noAsar = true;

export const debug = console.log;

const loadApp = () => {
    bindIPC();
    createMainWindow();
};

app.on("ready", loadApp);
