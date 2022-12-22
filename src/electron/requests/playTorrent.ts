import { BrowserWindow, shell } from "electron";
import { IpcMainEventListener, } from "typed-ipc";
import { settingsStore } from "../../react/electron-shared/settings";
import { exec } from "child_process"
import { getStremioExecPath, getStremioStremaingUrlFromTorrent } from "../stremio";
import { getCustomPlayerArgs } from "../customPlayerArgs";
import { playerOverlay } from "../playerOverlay";
import torrentInfo from "./torrentInfo";

export default (async (_, { magnet, data, playIndex }) => {
    const { settings } = settingsStore
    // todo ensure errors poppin up
    const { player } = settings;
    if (player.defaultPlayer === "stremio") {
        const stremioExecPath = getStremioExecPath()
        exec(`"${stremioExecPath}" "${magnet}"`)
    } else if (player.defaultPlayer === "custom") {
        let prog = player.customPlayerExecutable;
        if (!prog) throw new Error("defaultPlayer is custom, but customPlayerExecutable is missing in settings")
        if (!prog.includes("\"")) prog = `"${prog}"`
        const stremioStremaingUrl = await getStremioStremaingUrlFromTorrent(magnet, playIndex ?? 0)
        const playerArgs = getCustomPlayerArgs(data)
        const execCommand = `${prog} "${stremioStremaingUrl}" ${playerArgs}`;
        console.log("execCommand", execCommand)
        const child = exec(execCommand)
        let overlay: BrowserWindow | undefined
        let updateInterval: NodeJS.Timer
        child.on("exit", code => {
            overlay?.destroy()
            console.log(`Player exited ${code}`)
            clearInterval(updateInterval)
        })
        const enableOverlay = player.fullscreen/*  && player.overlay */
        if (enableOverlay) {
            overlay = await playerOverlay()
            updateInterval = setInterval(async () => {
                if (!overlay) return
                const info = await torrentInfo({} as any, { magnet, index: playIndex, })
                const infoPlaceholder = { downloading: 0, downloaded: 0, uploading: 0, uploaded: 0 }
                overlay.webContents.send("data", info === null ? infoPlaceholder : {
                    downloading: info.downloadSpeed,
                    downloaded: info.downloaded,
                    uploading: info.uploadSpeed,
                    uploaded: info.uploaded
                })
            }, 1000)
        }
        return
    } else {
        await shell.openExternal(magnet)
    }
}) satisfies IpcMainEventListener<"playTorrent">;
