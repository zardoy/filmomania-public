import { typedIpcMain } from "typed-ipc";

import { setupProxy } from "./proxySetup";
import { requestTorrentsList } from "./requests/torrentsList";
import { bindIPC as bindSettingsIPC, getAppSetting } from "./settings";
import { bindIPCEvents, isSodaPlayerInstalled, playWithSodaPlayer } from "./sodaPlayer";

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

