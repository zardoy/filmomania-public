import "./handleErrors";

// todo-high electron-reloader
import { app } from "electron";

import { bindIPC } from "./ipc";
import { createMainWindow } from "./mainWindow";

// electronDebug({
//     showDevTools: true
// });

if (require("electron-squirrel-startup")) app.quit();

process.noAsar = true;

export const debug = console.log;

const loadApp = () => {
    app.setName("FilmoMania Beta");
    bindIPC();
    createMainWindow();
};

app.on("ready", loadApp);
