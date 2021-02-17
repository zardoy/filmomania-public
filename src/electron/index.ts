import { AceConnector } from "ace-connector";
import { app } from "electron";

import { createMainWindow } from "./mainWindow";

export const aceConnector = new AceConnector();

const loadApp = () => {
    createMainWindow();
};

app.on("ready", loadApp);
