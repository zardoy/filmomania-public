import { exec, spawn, fork, ChildProcess } from "child_process"
import path, { join } from "path"
import { settingsStore } from "../react/electron-shared/settings"
import { request } from "http"
import parseTorrent from "parse-torrent";
import { typedIpcMain } from "typed-ipc";
import { mainWindow } from "./mainWindow";
import { existsSync } from "fs";
import electronIsDev from "electron-is-dev";

const isWin = process.platform === "win32";

export const getStremioStremaingUrlFromTorrent = async (magnet: string,) => {
    const { infoHash } = parseTorrent(magnet)
    if (!infoHash) throw new Error("Missing infoHash from provided magnet")
    await ensureStremioServerIsStarted()
    const { stremioServerUrl } = settingsStore.settings.player;
    return `${stremioServerUrl.replace(/\/$/, "")}/${infoHash}/0`
}

export const startStremioServer = () => {
    const builtinServerFile = join(__dirname, "./server.js")
    let child: ChildProcess | undefined
    if (settingsStore.settings.builtinStremioServer.enabled && existsSync(builtinServerFile)) {
        child = fork(builtinServerFile, {
            detached: true,
            stdio: "pipe"
        })
    } else {
        const stremioExecPath = getStremioExecPath()
        if (!existsSync(stremioExecPath)) throw new Error("Stremio is not installed")
        const serverJs = isWin ? join(stremioExecPath, "../server.js") : join(stremioExecPath, "Contents/MacOS/server.js");
        const nodeExec = isWin ? join(stremioExecPath, "../stremio-runtime.exe") : join(serverJs, "../node");
        child = spawn(`nodeExec`, [serverJs], { cwd: join(nodeExec, "..") })
    }
    if (!child) return
    child.stdout!.on("data", data => {
        console.log(`[debug stremio server] ${String(data).trim()}`)
    })
    child.stderr!.on("data", data => {
        console.log(`[error stremio server] ${String(data).trim()}`)
    })
    typedIpcMain.sendToWindow(mainWindow!, "stremioServerStatus", { up: true })
    child.on("exit", code => {
        console.log("stremio server exited", code)
        typedIpcMain.sendToWindow(mainWindow!, "stremioServerStatus", { up: false, })
    })
}

export const checkStremioServerIsStarted = async () => {
    const { stremioServerUrl } = settingsStore.settings.player;

    const isStarted = await new Promise<boolean>(resolve => {
        const req = request(stremioServerUrl, () => {
            resolve(true)
        })
        req.on("error", () => resolve(false))
        req.end()
    });
    typedIpcMain.sendToWindow(mainWindow!, "stremioServerStatus", { up: isStarted, })
    return isStarted
}

export const ensureStremioServerIsStarted = async () => {
    const { stremioServerUrl } = settingsStore.settings.player;
    const started = await checkStremioServerIsStarted()
    if (started) return
    const isLocal = stremioServerUrl.match(/((https?:\/\/)?localhost|127.0.0.1)/)
    if (!isLocal) throw new Error(`Remote stremio server ${stremioServerUrl} is unavailable`)
    startStremioServer()
    await new Promise(resolve => {
        setTimeout(resolve, 500)
    })
}

// we support mac, windows
export const getStremioExecPath = () => {
    let { stremioExec } = settingsStore.settings.player
    if (stremioExec === undefined) {
        if (isWin) return path.join(process.env.LOCALAPPDATA!, "Programs/LNV/stremio-4/Stremio.exe")
        else return "/Applications/Stremio.app"
    }
    if (stremioExec.startsWith("./")) stremioExec = path.join(__dirname, stremioExec)
    return stremioExec
}
