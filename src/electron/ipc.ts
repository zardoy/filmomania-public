import downloadFile from "download";
import { shell } from "electron";
import { tmpdir } from "os";
import { join } from "path";
import { typedIpcMain } from "typed-ipc";

import { setupProxy } from "./proxySetup";
import { requestTorrentsList } from "./requests/torrentsList";
import { settingsStore, userSettingsStore } from "./settings";
import { installOrAndPatchSodaPlayer, playWithSodaPlayer } from "./sodaPlayer";

export const bindIPC = () => {
    typedIpcMain.handleAllRequests({
        appInit: async () => {
            void setupProxy(); //runs in parallel
            const engineNeedsSetup = !await settingsStore.get("movieSearchEngine", "endpoint") || !await settingsStore.get("movieSearchEngine", "apiKey");
            const defaultPlayerUserValue = await settingsStore.getUserValue("player", "defaultPlayer");

            const needsPlayerSetup = defaultPlayerUserValue === undefined/*  || defaultPlayerUserValue === "stremio" */;
            // if (
            //     engineNeedsSetup ||
            //     needsPlayerSetup
            // ) {
            //     return {
            //         isFirstLaunch: true,
            //         specs: {
            //             sodaPlayer: {
            //                 installed: sodaPlayerInstalled,
            //                 patched: sodaPlayerPatched
            //             },
            //             engineNeedsSetup
            //         }
            //     };
            // } else {
            //     return {
            //         isFirstLaunch: false
            //     };
            // }
            return {
                isFirstLaunch: false
            };
        },
        torrentsList: requestTorrentsList,
        getStoredSettingValue: (_event, { path }) => userSettingsStore.get(path) as any,
        setStoredSettingValue: (_event, { path }) => userSettingsStore.set(path),
    });

    typedIpcMain.bindAllEventListeners({
        retryProxySetup: () => setupProxy(),
        // todo explain why async
        playTorrent: async (_e, { magnet, player }) => {
            if (player === "custom") {
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

