import downloadFile from "download";
import { shell } from "electron";
import { tmpdir } from "os";
import { join } from "path";
import { isPatchAvailable, patchSodaPlayer } from "soda-player-patch";
import { typedIpcMain } from "typed-ipc";

import { settingsStore } from "../react/electron-shared/settings";
import { setupProxy } from "./proxySetup";
import { requestTorrentsList } from "./requests/torrentsList";
import { installSodaPlayer, isSodaPlayerInstalled, playWithSodaPlayer } from "./sodaPlayer";

export const bindIPC = () => {
    typedIpcMain.handleAllRequests({
        appInit: async () => {
            void setupProxy();
            const engineNeedsSetup = !await settingsStore.get("searchEngineApiEndpoint") || !await settingsStore.get("searchEngineApiKey");
            const defaultPlayer = await settingsStore.get("generalDefaultPlayer");
            const sodaPlayerNeedsToBeInstalled = defaultPlayer === undefined || defaultPlayer === "system" && !isSodaPlayerInstalled();
            if (
                engineNeedsSetup ||
                sodaPlayerNeedsToBeInstalled
            ) {
                return {
                    isFirstLaunch: true,
                    specs: {
                        sodaPlayer: {
                            installed: isSodaPlayerInstalled(),
                            patched: !await isPatchAvailable()
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
        patchSodaPlayer: async () => {
            await patchSodaPlayer();
        }
    });

    typedIpcMain.bindAllEventListeners({
        retryProxySetup: () => setupProxy(),
        playInPlayer: async (_e, { magnet, player }) => {
            if (player === "system") {
                await shell.openExternal(magnet);
            } else if (!player || player === "sodaPlayer") {
                await playWithSodaPlayer(magnet);
            }
        },
        installSodaPlayer: installSodaPlayer,
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

