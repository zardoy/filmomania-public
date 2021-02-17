import { ConnectionError } from "ace-connector";
import { typedIpcMain } from "typed-ipc";

import { aceConnector } from "./";
import { mainWindow } from "./mainWindow";

const onFirstRun = async () => {
    typedIpcMain.sendToWindow(mainWindow, "firstRun", null);
    let installedAceStreamVersion: string | null = null;
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
    // players
    typedIpcMain.sendToWindow(mainWindow, "firstRunSpecs", {
        installedAceStreamVersion,
        installedPlayers: []
    });
};

typedIpcMain.handleAllQueries({
    appInit: async () => {
        // const firstLaunch = fs.existsSync(
        //     path.resolve(app.getPath("userData"), "settings.json")
        // );
        const isFirstLaunch = true;
        return {
            isFirstLaunch
        };
    },
    torrentsList: async (event, { searchQuery }) => {
        const;

        return {
            torrents: 
        };
    }
});
