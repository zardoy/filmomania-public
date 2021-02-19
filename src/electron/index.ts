import { AceConnector } from "ace-connector";
import { app } from "electron";

import { bindIPC } from "./ipc";
import { createMainWindow } from "./mainWindow";

export const aceConnector = process.platform === "win32" ? new AceConnector() : null;

const loadApp = () => {
    bindIPC();
    createMainWindow();
};

app.on("ready", loadApp);
