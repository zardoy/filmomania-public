import { typedIpcMain } from "typed-ipc";

import { setupProxy } from "./proxySetup";
import { requestTorrentsList } from "./requests/torrentsList";
import { bindIPC as bindSettingsIPC, getAppSetting } from "./settings";
import { bindIPCEvents, isSodaPlayerInstalled, playWithSodaPlayer } from "./sodaPlayer";

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
            //todo-high use schema
            const isFirstLaunch = !await getAppSetting("searchEngine", "apiKey") || !await getAppSetting("searchEngine", "apiEndpoint");
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
    typedIpcMain.addEventListener("playInPlayer", async (_e, { magnet }) => {
        await playWithSodaPlayer(magnet);
    });
};

