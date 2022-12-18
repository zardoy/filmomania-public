import { exec } from "child_process"
import path, { join } from "path"
import { settingsStore } from "../react/electron-shared/settings"
import { request } from "http"

const isWin = process.platform === "win32";

export const startStremioServer = () => {
    const stremioExecPath = getStremioExecPath()
    const serverJs = isWin ? join(stremioExecPath, "../server.js") : join(stremioExecPath, "Contents/MacOS/server.js");
    const nodeExec = isWin ? join(stremioExecPath, "../stremio-runtime.exe") : join(serverJs, "../node");
    const {stdout} = exec(`"${nodeExec}" "${serverJs}"` )
    stdout!.on("data", data => {
        console.log(`[debug stremio server]${String(data).trim()}`)
    })
}

export const ensureStremioServerIsStarted = async (ip: string) => {
    const isLocal = ip.match(/((https?:\/\/)?localhost|127.0.0.1)/)
    const started = await new Promise<boolean>(resolve => {
        const req = request(ip, () => {
            resolve(true)
        })
        req.on("error", () => resolve(false))
        req.end()
    })
    if (started) return
    if (!isLocal) throw new Error(`Remove stremio server ${ip} is unavailable`)
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
