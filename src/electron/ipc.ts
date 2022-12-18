import downloadFile from "download";
import { shell } from "electron";
import { tmpdir } from "os";
import { join } from "path";
import { typedIpcMain } from "typed-ipc";

import { setupProxy } from "./proxy";
import { requestTorrentsList } from "./requests/torrentsList";
import { playWithSodaPlayer } from "./sodaPlayer";

export const bindIPC = () => {
    typedIpcMain.handleAllRequests({
        torrentsList: requestTorrentsList
    })

    typedIpcMain.bindAllEventListeners({
        retryProxySetup: setupProxy,
        // todo explain why async
        playTorrent: async (_e, { magnet }) => {
            // if (player === "custom") {
            //     await shell.openExternal(magnet)
            // } else {
            //     await playWithSodaPlayer(magnet)
            // }
        },
        downloadAndOpenTorrentFile: async (_e, { torrentFileUrl }) => {
            const tempDir = tmpdir()
            //todo-high preserve torrent name
            await downloadFile(tempDir, torrentFileUrl, {
                filename: "torrent"
            })
            await shell.openPath(join(tempDir, "torrent"))
        }
    })
}
