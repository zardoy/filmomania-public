import { ConnectionError } from "ace-connector";
import { typedIpcMain } from "typed-ipc";

import { aceConnector } from "./";
import { mainWindow } from "./mainWindow";

import electronSettings from "electron-settings";

const onFirstLaunch = async () => {
    let installedAceStreamVersion: string | null = null;
    if (aceConnector) {
        try {
            await aceConnector.connect();
            // todo-low simplify it
            if (aceConnector.engine.status === "connected") {
                installedAceStreamVersion = aceConnector.engine.version;
            }
        } catch (err) {
            if (
                err instanceof ConnectionError &&
                err.type === "ACE_ENGINE_NOT_INSTALLED"
            ) {
                installedAceStreamVersion = null;
            } else {
                throw err;
            }
        }
    }
    // players
    typedIpcMain.sendToWindow(mainWindow, "firstRunSpecs", {
        installedAceStreamVersion,
        installedPlayers: []
    });
    await new Promise<void>(resolve => {
        typedIpcMain.addEventListener("setupFirstLaunch", (_, { defaultPlayerIndex }) => {
            typedIpcMain.removeAllListeners("setupFirstLaunch");
            resolve();
            // electronSettings.setSync("defaultPlayer", )
        });
    });
};

export const bindIPC = () => {
    //@ts-ignore
    typedIpcMain.handleAllRequests({
        appInit: async () => {
            // const firstLaunch = fs.existsSync(
            //     path.resolve(app.getPath("userData"), "settings.json")
            // );
            const isFirstLaunch = false;
            if (isFirstLaunch) void onFirstLaunch();
            return {
                isFirstLaunch
            };
        },
    });
};

