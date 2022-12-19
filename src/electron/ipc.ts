import downloadFile from "download";
import { shell } from "electron";
import { tmpdir } from "os";
import { join } from "path";
import { typedIpcMain } from "typed-ipc";
import { settingsStore } from "../react/electron-shared/settings";

import { setupProxy } from "./proxy";
import playTorrent from "./requests/playTorrent";
import { requestTorrentsList } from "./requests/torrentsList";

export const bindIPC = () => {
    typedIpcMain.handleAllRequests({
        torrentsList: requestTorrentsList,
        setupProxy,
        test: () => {
            settingsStore.set("dev", "counter", (settingsStore.settings.dev.counter || 0)+1)
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
        }
    })
}
