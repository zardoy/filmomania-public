import { spawn, fork, ChildProcess } from "child_process"
import path, { join } from "path"
import { settingsStore } from "../react/electron-shared/settings"
import { request } from "http"
import parseTorrent from "parse-torrent";
import { typedIpcMain } from "typed-ipc";
import { mainWindow } from "./mainWindow";
import { existsSync } from "fs";
import got, { } from "got"
import { app } from "electron";
import onExit from "exit-hook"
import killPort from "kill-port"
import electronIsDev from "electron-is-dev";

const isWin = process.platform === "win32";

export const getHashFromMagnet = (magnet: string,) => {
    const { infoHash } = parseTorrent(magnet)
    if (!infoHash) throw new Error("Missing infoHash from provided magnet")
    return infoHash
}

export const getStremioStremaingUrlFromTorrent = async (magnet: string, index = 0) => {
    await ensureStremioServerIsStarted()
    return `${getStremioServerUrl()}/${getHashFromMagnet(magnet)}/${index}?external=1`
}

let stremioServerChild: ChildProcess | undefined

onExit(() => {
    stremioServerChild?.kill()
})

app.on("window-all-closed", () => {
    stremioServerChild?.kill()
})

export const killStremioServer = () => {
    stremioServerChild?.kill()
}

export const startStremioServer = async () => {
    const builtinServerFile = join(__dirname, "./server.js")
    let child: ChildProcess
    const { enabled: builtinEnabled, overrideRootPath } = settingsStore.settings.builtinStremioServer
    if (builtinEnabled && existsSync(builtinServerFile)) {
        child = fork(builtinServerFile, {
            detached: true,
            stdio: "pipe",
            env: {
                // todo might be required on mac without stremio installation
                APP_PATH: overrideRootPath ? path.resolve(app.getPath("userData"), overrideRootPath) : undefined,
                ...process.env
            }
        })
    } else {
        const stremioExecPath = getStremioExecPath()
        if (!existsSync(stremioExecPath)) throw new Error("Stremio is not installed")
        const serverJs = isWin ? join(stremioExecPath, "../server.js") : join(stremioExecPath, "Contents/MacOS/server.js");
        const nodeExec = isWin ? join(stremioExecPath, "../stremio-runtime.exe") : join(serverJs, "../node");
        child = spawn(`nodeExec`, [serverJs], { cwd: join(nodeExec, "..") })
    }
    stremioServerChild = child
    if (!child) return
    await new Promise<void>((resolve, reject) => {
        child.stderr!.on("data", data => {
            console.log(`[error stremio server] ${String(data).trim()}`)
        })
        child.on("exit", code => {
            console.log("stremio server exited", code)
            reject(`Exited with ${code}`)
            typedIpcMain.sendToWindow(mainWindow!, "stremioServerStatus", { up: false, })
        })
        child.stdout!.on("data", data => {
            data = String(data).trim()
            if (data.startsWith("EngineFS server started")) resolve()
            console.log(`[debug stremio server] ${data}`)
        })
    })
    typedIpcMain.sendToWindow(mainWindow!, "stremioServerStatus", { up: true })
}

// effectively is engineFs server
export const getStremioServerUrl = () => {
    const { stremioServerUrl } = settingsStore.settings.player;
    return stremioServerUrl.replace(/\/$/, "")
}

// also used to check that it is started
export const makeStremioServerRequest = async <T>(path = "") => {
    await ensureStremioServerIsStarted()
    try {
        const { body } = await got(`${getStremioServerUrl()}/${path}`, { responseType: "json" })
        return body as T
    } catch (err: any) {
        if (err?.code === "ECONNREFUSED") {
            // todo start here
            // return makeStremioServerRequest(path)
        }
        throw err
    }
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
    const stremioServerUrl = getStremioServerUrl()
    const started = await checkStremioServerIsStarted()
    if (started) return
    const isLocal = stremioServerUrl.match(/((https?:\/\/)?localhost|127.0.0.1)/)
    if (!isLocal) throw new Error(`Remote stremio server ${stremioServerUrl} is unavailable`)
    await startStremioServer()
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
