import downloadFile from "download";
import { shell } from "electron";
import { tmpdir } from "os";
import { join } from "path";
import { typedIpcMain } from "typed-ipc";
import { settingsStore } from "../react/electron-shared/settings";
import { initHooksFile } from "./hooksFile";

import { setupProxy } from "./proxy";
import playTorrent, { sendMpvCommand } from "./requests/playTorrent";
import torrentInfo from "./requests/torrentInfo";
import { requestTorrentsList } from "./requests/torrentsList";
import { getStremioStremaingUrlFromTorrent, startStremioServer, checkStremioServerIsStarted, killStremioServer } from "./stremio";

export const bindIPC = () => {
    typedIpcMain.handleAllRequests({
        torrentsList: requestTorrentsList,
        setupProxy,
        test: () => {
            settingsStore.set("dev", "counter", (settingsStore.settings.dev.counter || 0) + 1)
        },
        getStremioStreamingLink(_, { magnet }) {
            return getStremioStremaingUrlFromTorrent(magnet)
        },
        getTorrentInfo: torrentInfo,
        mpvCommand(_, { args }) {
            return sendMpvCommand(args)
        },
        reloadHooksFile() {
            return initHooksFile()
        }
    })

    typedIpcMain.bindAllEventListeners({
        // todo explain why async
        playTorrent,
        downloadTorrentFile: async (_e, { torrentFileUrl }) => {
            const tempDir = tmpdir()
            //todo-high preserve torrent name
            await downloadFile(tempDir, torrentFileUrl, {
                filename: "temp.torrent"
            })
            shell.showItemInFolder(join(tempDir, "temp.torrent"))
        },
        async openSettingsFile() {
            await shell.openExternal(settingsStore.filePath)
        },
        async stremioServerStatus() {
            await checkStremioServerIsStarted()
        },
        async startStremioServer() {
            await startStremioServer()
        },
        killStremioServer() {
            killStremioServer()
        }
    })
}
