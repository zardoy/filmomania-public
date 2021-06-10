import downloadFile from "download";
import { shell } from "electron";
import { tmpdir } from "os";
import { join } from "path";
import { sodaPlayerBasicConfig } from "soda-player-patch";
import { isPatchAvailable } from "soda-player-patch/build/patchElectronApp";
import { typedIpcMain } from "typed-ipc";

import { settingsStore } from "../react/electron-shared/settings";
import { setupProxy } from "./proxySetup";
import { requestTorrentsList } from "./requests/torrentsList";
import { installOrAndPatchSodaPlayer, isSodaPlayerInstalled, playWithSodaPlayer } from "./sodaPlayer";

export const bindIPC = () => {
    typedIpcMain.handleAllRequests({
        appInit: async () => {
            void setupProxy(); //runs in parallel
            const engineNeedsSetup = !await settingsStore.get("searchEngineApiEndpoint") || !await settingsStore.get("searchEngineApiKey");
            const defaultPlayer = await settingsStore.get("generalDefaultPlayer");

            const sodaPlayerInstalled = isSodaPlayerInstalled();
            const sodaPlayerPatched = sodaPlayerInstalled && !await isPatchAvailable(sodaPlayerBasicConfig);

            const needsPlayerSetup = defaultPlayer === undefined || defaultPlayer !== "system" && !sodaPlayerInstalled;
            if (
                engineNeedsSetup ||
                needsPlayerSetup
            ) {
                return {
                    isFirstLaunch: true,
                    specs: {
                        sodaPlayer: {
                            installed: sodaPlayerInstalled,
                            patched: sodaPlayerPatched
                        },
                        engineNeedsSetup
                    }
                };
            } else {
                return {
                    isFirstLaunch: false
                };
            }
        },
        torrentsList: requestTorrentsList,
        getHelloMessage: async () => "Hey there!"
    });

    typedIpcMain.bindAllEventListeners({
        retryProxySetup: () => setupProxy(),
        playInPlayer: async (_e, { magnet, player }) => {
            if (player === "system") {
                await shell.openExternal(magnet);
            } else {
                await playWithSodaPlayer(magnet);
            }
        },
        installOrAndPatchSodaPlayer: installOrAndPatchSodaPlayer,
        cancelSodaPlayerDownload: () => {
            // NOT IMPLEMENTED YET
        },
        downloadAndOpenTorrentFile: async (_e, { torrentFileUrl }) => {
            const tempDir = tmpdir();
            //todo-high preserve torrent name
            await downloadFile(tempDir, torrentFileUrl, {
                filename: "torrent"
            });
            await shell.openPath(join(tempDir, "torrent"));
        }
    });
};

