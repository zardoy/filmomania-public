import { BrowserWindow, globalShortcut, shell } from "electron";
import { IpcMainEventListener, IpcMainEvents, IpcMainRequests, } from "typed-ipc";
import { settingsStore } from "../../react/electron-shared/settings";
import { ChildProcess, exec } from "child_process"
import { getStremioExecPath, getStremioStremaingUrlFromTorrent } from "../stremio";
import { playerOverlay } from "../playerOverlay";
import torrentInfo from "./torrentInfo";
import { PlayerInputData } from "../../react/electron-shared/ipcSchema";
import MpvSocket from "mpv/socket.js"
import { Socket } from "net";
import electronIsDev from "electron-is-dev";
import { graphics } from "systeminformation"
import { hooksFile } from "../hooksFile";
import { GracefulError, silentAllErrors } from "../handleErrors";

let mpvSocket

export default (async (_, playData) => {
    const { magnet, data, playIndex } = playData
    const { settings } = settingsStore
    const { player: { defaultPlayer, playerExecutable } } = settings;
    if (defaultPlayer === "stremio") {
        const stremioExecPath = getStremioExecPath()
        exec(`"${stremioExecPath}" "${magnet}"`)
    } else if (defaultPlayer === "custom" || defaultPlayer === "mpv") {
        let prog = playerExecutable;
        if (!prog) throw new GracefulError("defaultPlayer is mpv or custom, but playerExecutable is missing in settings")
        if (!prog.includes("\"")) prog = `"${prog}"`
        const stremioStremaingUrl = await getStremioStremaingUrlFromTorrent(magnet, playIndex ?? 0)
        const playerArgs = getCustomPlayerArgs(data)
        const execCommand = `${prog} "${stremioStremaingUrl}" ${playerArgs}`;
        console.log("execCommand", execCommand)
        const child = exec(execCommand)
        child.on("exit", code => {
            console.log(`Player exited ${code}`)
        })
        if (defaultPlayer === "mpv") {
            await mpvPostActions(child, playData)
        }
        return
    } else {
        await shell.openExternal(magnet)
    }
}) satisfies IpcMainEventListener<"playTorrent">;

const socketPath = process.platform === "win32" ? "\\\\.\\pipe\\filmomania-mpvsocket" : "/tmp/filmomania-mpvsocket"

const getCustomPlayerArgs = ({ playbackName, startTime }: PlayerInputData) => {
    const { defaultPlayer, fullscreen } = settingsStore.settings.player;
    if (defaultPlayer === "mpv") {
        return [
            `--force-media-title="${playbackName}"`,
            `--input-ipc-server=${socketPath}`,
            // todo try to autodetect
            // "--audio-spdif=ac3,dts,eac3",
            ...startTime ? [`--start="+0:0:${startTime}"`] : [],
            ...fullscreen ? ["--fullscreen"] : []
        ].join(" ")
    }
    return ""
}

export const sendMpvCommand = (args: IpcMainRequests["mpvCommand"]["variables"]["args"]) => {
    if (!mpvSocket) throw new Error("Mpv is not active")
    return mpvSocket.send(...args)
}

const ChangePropertyId = {
    FULLSCREEN: 1,
    PAUSE: 2
}

// todo refactor
const observePropertiesCallbacks = new Map<string, Array<(data) => any>>()

const mpvPostActions = async (child: ChildProcess, { magnet, playIndex }: IpcMainEvents["playTorrent"]) => {
    // mpv: assuming single instance is enabled
    if (mpvSocket) return
    const { player } = settingsStore.settings;
    const enableOverlay = false || player.fullscreen/*  && player.overlay */
    if (enableOverlay) {
        let overlay: BrowserWindow | undefined
        const socket: Socket & { send, on } = new MpvSocket(socketPath, () => {
            socket.emit("connection-close")
            observePropertiesCallbacks.clear()
            // if it didn't happen for some reason
            child.kill()
            mpvSocket = undefined
            console.log("mpv socket closed")
        })
        socket.on("event", (_, e: { event, id, data, name }) => {
            if (e.event !== "property-change") return
            for (const callback of observePropertiesCallbacks.get(e.name) ?? []) {
                callback(e.data)
            }
            if (e.id === ChangePropertyId.FULLSCREEN) {
                if (!overlay) return
                if (e.data) {
                    overlay.showInactive()
                } else {
                    overlay.hide()
                }
            }
        })
        let i = 5
        hooksFile?.mpvStarted(socket, {
            async observeProperty(prop, callback) {
                if (!observePropertiesCallbacks.has(prop)) observePropertiesCallbacks.set(prop, [])
                observePropertiesCallbacks.get(prop)!.push(callback)
                if (Object.keys(!ChangePropertyId).some(p => p.toLowerCase() === prop)) {
                    await sendMpvCommand(["observe_property", i++, prop])
                }
            },
            onClose(callback) {
                socket.addListener("connection-close", callback)
            },
        })
        mpvSocket = socket
        const [mpvDisplayName] = await sendMpvCommand(["get_property", "display-names"])
        await sendMpvCommand(["observe_property", ChangePropertyId.FULLSCREEN, "fullscreen"])
        await sendMpvCommand(["observe_property", ChangePropertyId.PAUSE, "pause"])
        const { displays } = await graphics()
        const mpvDisplayData = displays.find(({ deviceName }) => deviceName === mpvDisplayName)

        let updateInterval: NodeJS.Timer
        child.on("exit", () => {
            globalShortcut.unregister("Shift+F5")
            overlay?.destroy()
            clearInterval(updateInterval)
        })
        overlay = await playerOverlay(mpvDisplayData ? {
            x: mpvDisplayData.positionX,
            y: mpvDisplayData.positionY,
        } : undefined)
        globalShortcut.register("Shift+F5", () => {
            if (!overlay) return
            if (overlay.isVisible()) {
                overlay.hide()
            } else {
                overlay.showInactive()
            }
        })
        updateInterval = setInterval(async () => {
            if (!overlay) return
            const info = await torrentInfo({} as any, { magnet, index: playIndex, })
            const infoPlaceholder = { downloading: 0, downloaded: 0, uploading: 0, uploaded: 0 }
            overlay.webContents.send("data", info === null ? infoPlaceholder : {
                downloading: info.downloadSpeed,
                downloaded: info.downloaded,
                uploading: info.uploadSpeed,
                uploaded: info.uploaded
                // uploaded: info.uploaded
            })
        }, 1000)
    }
}
