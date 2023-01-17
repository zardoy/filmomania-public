import { BrowserWindow, globalShortcut, Point, shell } from "electron";
import { IpcMainEventListener, IpcMainEvents, IpcMainRequests, typedIpcMain, } from "typed-ipc";
import { settingsStore } from "../../react/electron-shared/settings";
import { ChildProcess, exec } from "child_process"
import { getStremioExecPath, getStremioStremaingUrlFromTorrent } from "../stremio";
import { playerOverlay } from "../playerOverlay";
import torrentInfo from "./torrentInfo";
import { PlayerInputData } from "../../react/electron-shared/ipcSchema";
import MpvSocket from "mpv/socket.js"
import { Socket } from "net";
import { currentLoad, graphics, mem } from "systeminformation"
import { hooksFile } from "../hooksFile";
import { GracefulError, } from "../handleErrors";
import { screen } from "electron/main";
import { mainWindow } from "../mainWindow";
import { makePlayerStateUpdate } from "../remoteUiControl";

let mpvSocket

let overlay: BrowserWindow | undefined

let previousChild: ChildProcess | undefined

let lastOpenPlayData

const handler = (async (_, playData) => {
    const { magnet, data, playIndex } = playData;
    const { settings } = settingsStore;
    const { player: { defaultPlayer, playerExecutable, enableAdvancedOverlay, killPrevious } } = settings;
    if (defaultPlayer === "stremio") {
        const stremioExecPath = getStremioExecPath();
        exec(`"${stremioExecPath}" "${magnet}"`);
    } else if (defaultPlayer === "custom" || defaultPlayer === "mpv") {
        let prog = playerExecutable;
        if (!prog)
            throw new GracefulError("defaultPlayer is mpv or custom, but playerExecutable is missing in settings");
        if (!prog.includes("\""))
            prog = `"${prog}"`;
        const stremioStremaingUrl = await getStremioStremaingUrlFromTorrent(magnet, playIndex ?? 0);
        const playerArgs = getCustomPlayerArgs(data);
        const execCommand = `${prog} "${stremioStremaingUrl}" ${playerArgs}`;
        console.log("execCommand", execCommand);
        if (killPrevious && previousChild) {
            if (mpvSocket) {
                await sendMpvCommand(["quit"])
            } else {
                previousChild.kill();
            }
            await new Promise(resolve => {
                setTimeout(resolve, 150)
            })
        }
        if (defaultPlayer === "mpv" && enableAdvancedOverlay && settings.player.fullscreen) {
            // todo rep electron bug, required to init before fullscreen application focus
            overlay = await playerOverlay();

        }
        const child = previousChild = exec(execCommand);
        child.on("exit", code => {
            console.log(`Player exited ${code}`);
        });
        lastOpenPlayData = playData;
        if (defaultPlayer === "mpv") {
            await mpvPostActions(child, playData);
        }
        return;
    } else {
        await shell.openExternal(magnet);
    }
}) satisfies IpcMainEventListener<"playTorrent">;

export default handler;

export const restartPlayer = () => {
    if (!lastOpenPlayData) return
    void handler({} as any, lastOpenPlayData)
}

const socketPath = process.platform === "win32" ? "\\\\.\\pipe\\filmomania-mpvsocket" : "/tmp/filmomania-mpvsocket"

const getCustomPlayerArgs = ({ playbackName, startTime }: PlayerInputData) => {
    const { defaultPlayer, fullscreen, rememberFilmPosition } = settingsStore.settings.player;
    if (!rememberFilmPosition) startTime = undefined
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

export const sendMpvCommand = (args: IpcMainRequests["mpvCommand"]["variables"]["args"], reportError = true) => {
    if (!mpvSocket) {
        if (reportError) throw new Error("Mpv is not active")
        else return
    }
    return mpvSocket.send(...args)
}

const ChangePropertyId = {
    "FULLSCREEN": 1,
    "PAUSE": 2,
    "audio-params": 3,
    "display-names": 4
}

export const togglePlayerOverlay = (makeReload = false) => {
    if (!overlay) return
    if (overlay.isVisible()) {
        overlay.hide()
    } else {
        if (makeReload) overlay.webContents.reload()
        overlay.show()
    }
}

// todo refactor
const observePropertiesCallbacks = new Map<string, Array<(data) => any>>()

const mpvPostActions = async (child: ChildProcess, { magnet, playIndex, data }: IpcMainEvents["playTorrent"]) => {
    // mpv: assuming single instance is enabled
    if (mpvSocket) return
    const { player } = settingsStore.settings;
    const { remoteUiControl } = player
    if (!overlay && !hooksFile && !remoteUiControl) return

    console.log("spawning socket")
    const socket: Socket & { send, on } = new MpvSocket(socketPath, () => {
        socket.emit("connection-close")
        observePropertiesCallbacks.clear()
        // if it didn't happen for some reason
        child.kill()
        mpvSocket = undefined
        console.log("mpv socket closed")
    })
    socket.on("event", async (_, e: { event, id, data, name }) => {
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
        if (e.id === ChangePropertyId["audio-params"] && e.data) {
            overlay?.webContents.send("data-temp", `[audio] Channels: ${e.data["channel-count"]}`)
        }
        if (e.id === ChangePropertyId["display-names"] && e.data) {
            const [mpvDisplayName] = e.data
            const { displays } = await graphics()
            console.log(`moving overlay to display ${displays.findIndex(({ deviceName }) => deviceName === mpvDisplayName)}`)
            const mpvDisplayData = displays.find(({ deviceName }) => deviceName === mpvDisplayName)
            if (mpvDisplayData) {
                overlay!.setBounds({ x: mpvDisplayData.positionX, y: mpvDisplayData.positionY })
            }
        }
        // pause watched later below
    })
    let i = 15
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
    await sendMpvCommand(["observe_property", ChangePropertyId.FULLSCREEN, "fullscreen"])
    await sendMpvCommand(["observe_property", ChangePropertyId.PAUSE, "pause"])

    let fileDuration: number | undefined
    let currentPlaybackTime = data.startTime ?? 0
    let isPlaying = true
    const syncPlayerState = () => {
        makePlayerStateUpdate({
            isPlaying,
            time: currentPlaybackTime,
            title: data.playbackName,
            maxTime: fileDuration ?? 0,
            volume: 0,
        });
    };
    syncPlayerState()

    if (!overlay && !remoteUiControl) return

    let updateInterval: NodeJS.Timer
    child.on("exit", () => {
        globalShortcut.unregister("Shift+F5")
        overlay?.destroy()
        overlay = undefined
        clearInterval(updateInterval)
        typedIpcMain.sendToWindow(mainWindow!, "playerExit", {})
        makePlayerStateUpdate({
            title: null,
            isPlaying: false,
            time: 0,
            maxTime: 0,
            volume: 0,
        });
        console.log("player exited, overlay destroyed")
    })
    if (overlay) {
        globalShortcut.register("Shift+F5", () => {
            togglePlayerOverlay(true)
        })
        await sendMpvCommand(["observe_property", ChangePropertyId["audio-params"], "audio-params"])
        await sendMpvCommand(["observe_property", ChangePropertyId["display-names"], "display-names"])
    }
    const getLoadStats = async () => {
        const cpuLoad = await currentLoad()
        const { controllers } = await graphics()
        const gpuLoad = controllers.map(controller => controller.utilizationGpu ?? -1).join(", ")
        const { total, used } = await mem()
        return {
            cpuLoad,
            gpuLoad,
            ramLoad: Math.round(total / used)
        }
    }
    let previousCursorPos: Point | undefined
    updateInterval = setInterval(async () => {
        if (!overlay && !remoteUiControl) return
        fileDuration = Math.floor(await sendMpvCommand(["get_property", "duration"]).catch(() => undefined))
        currentPlaybackTime = Math.floor(await sendMpvCommand(["get_property", "playback-time"]).catch(() => -1))
        syncPlayerState()
        if (!overlay) return
        // const cursorScreenPoint = screen.getCursorScreenPoint()
        // if (previousCursorPos && previousCursorPos.x === cursorScreenPoint.x && previousCursorPos.y === cursorScreenPoint.y && !overlay.isFocused()) {
        //     overlay.setIgnoreMouseEvents(false)
        //     overlay.setFocusable(true)
        //     overlay.focus()
        // } else {
        //     previousCursorPos = cursorScreenPoint
        // }
        const info = await torrentInfo({} as any, { magnet, index: playIndex, })
        if (!overlay) return
        const infoPlaceholder = { downloading: 0, downloaded: 0, uploading: 0, uploaded: 0 }
        const loadStats = player.advancedOverlayLoadStats ? await getLoadStats() : {}
        if (!overlay) return
        overlay.webContents.send("data", info === null ? infoPlaceholder : {
            downloading: info.downloadSpeed,
            downloaded: info.downloaded,
            uploading: info.uploadSpeed,
            uploaded: info.uploaded,
            ...loadStats
        })
    }, 1000)
    socket.on("event", (_, { id, data }: { event, id, data, name }) => {
        if (id === ChangePropertyId.PAUSE) {
            isPlaying = !data
            syncPlayerState()
        }
    })
}
