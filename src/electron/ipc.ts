import { typedIpcMain } from "typed-ipc";

import { setupProxy } from "./proxySetup";
import { requestTorrentsList } from "./requests/torrentsList";
import { bindIPC as bindSettingsIPC, getAppSetting } from "./settings";
import { bindIPCEvents, isSodaPlayerInstalled } from "./sodaPlayer";

const onFirstLaunch = async () => {
    // let installedAceStreamVersion: string | null = null;
    // if (aceConnector) {
    //     try {
    //         await aceConnector.connect();
    //         // todo-low simplify it
    //         if (aceConnector.engine.status === "connected") {
    //             installedAceStreamVersion = aceConnector.engine.version;
    //         }
    //     } catch (err) {
    //         if (
    //             err instanceof ConnectionError &&
    //             err.type === "ACE_ENGINE_NOT_INSTALLED"
    //         ) {
    //             installedAceStreamVersion = null;
    //         } else {
    //             throw err;
    //         }
    //     }
    // }
    // // players
    // typedIpcMain.sendToWindow(mainWindow, "firstRunSpecs", {
    //     installedAceStreamVersion,
    //     installedPlayers: []
    // });
    // await new Promise<void>(resolve => {
    //     typedIpcMain.addEventListener("setupFirstLaunch", (_, { defaultPlayerIndex }) => {
    //         typedIpcMain.removeAllListeners("setupFirstLaunch");
    //         resolve();
    //         // electronSettings.setSync("defaultPlayer", )
    //     });
    // });
};

export const bindIPC = () => {
    typedIpcMain.handleAllRequests({
        appInit: async () => {
            const isFirstLaunch = !await getAppSetting("searchEngine", "apiKey");
            void setupProxy();
            if (isFirstLaunch) {
                return {
                    isFirstLaunch: true,
                    specs: {
                        sodaPlayerInstalled: isSodaPlayerInstalled()
                    }
                };
            } else {
                return {
                    isFirstLaunch: false
                };
            }
        },
        appSetting: async (_e, { scope, name }) => await getAppSetting(scope, name),
        torrentsList: requestTorrentsList
    });

    bindIPCEvents();

    bindSettingsIPC();

    typedIpcMain.addEventListener("retryProxySetup", () => setupProxy());
};

