import { typedIpcMain } from "typed-ipc"
import { Server, WebSocket, WebSocketServer } from "ws"
import { mainWindow } from "./mainWindow"
import serveHandler from "serve-handler"
import http from "http"
import { Except } from "type-fest"
import { restartPlayer, sendMpvCommand, togglePlayerOverlay } from "./requests/playTorrent"
import { networkInterfaces } from "os"
import { settingsStore } from "../react/electron-shared/settings"
import electronIsDev from "electron-is-dev"
import { join } from "path"
import { getFileFromUnpacked } from "./playerOverlay"
import { exec } from "child_process"
import { app } from "electron"

let wsServer: Server<WebSocket> | undefined
let serverListening = false

let lastKnownPlayerState: PlayerStatusReport | undefined

export const startRemoteServer = async () => {
    // todo watch setting, for now requires restart
    if (!settingsStore.settings.player.remoteUiControl) return
    const server = http.createServer((req, res) => {
        return serveHandler(req, res, {
            public: electronIsDev ? join(__dirname, "../../dist-remote-ui") : getFileFromUnpacked("dist-remote-ui"),
            rewrites: [{
                source: "/",
                destination: "/index.html",
            }],
            headers: [
                {
                    "source": "**/*.@(html|css|js|png|jpg)",
                    "headers": [{
                        "key": "Cache-Control",
                        "value": "max-age=7200"
                    }]
                }
            ]
        })
    })
    const remoteHttpPort = settingsStore.settings.player.remoteUiControlPort ?? settingsStore.settingsSchema.player.remoteUiControlPort.schema.default;
    server.listen(remoteHttpPort, () => {
        console.log(`[remote-ui] Running http server at ${remoteHttpPort} port`)
    })
    const wss = new WebSocketServer({
        server,
        path: "/ws"
    })
    wsServer = wss
    await new Promise<void>(resolve => {
        wss.once("listening", resolve)
    })
    serverListening = true
    console.log("[remote-ui] WebSocket server ready!")
    typedIpcMain.sendToWindow(mainWindow, "remoteUiServerStatus", { up: true })
    wss.on("close", () => {
        typedIpcMain.sendToWindow(mainWindow, "remoteUiServerStatus", { up: false })
        wsServer = undefined
        serverListening = false
    })
    const clientMessageHandler = data => {
        const parsed = JSON.parse(data.toString())
        if ("mpv" in parsed) {
            sendMpvCommand(parsed.mpv, false)
        }
        if ("command" in parsed) {
            switch (parsed.command) {
                case "shutdown":
                    exec("shutdown /s")
                    break
                case "restartPlayer":
                    restartPlayer()
                    break
                case "closeApp":
                    sendMpvCommand(["quit"])
                    app.quit()
                    break
                case "toggleOverlay":
                    togglePlayerOverlay()
                    break
            }
        }
    }
    wss.on("connection", ws => {
        ws.on("message", clientMessageHandler)
        ws.on("close", () => {
            ws.removeEventListener("message", clientMessageHandler)
        })

        if (lastKnownPlayerState) ws.send(JSON.stringify(lastKnownPlayerState))
    })
}

export const sendRemoteUiServerStatus = () => {
    const localIp = getLocalIp();
    typedIpcMain.sendToWindow(mainWindow, "remoteUiServerStatus", { up: serverListening, ip: localIp && `${localIp}:${settingsStore.settings.player.remoteUiControlPort}` })
}

export const sendRemoteUi = data => {
    if (!wsServer) return
    for (const client of wsServer.clients) {
        client.send(JSON.stringify(data))
    }
}

export const makePlayerStateUpdate = (dataInput: Except<PlayerStatusReport, "type">) => {
    const data: PlayerStatusReport = { ...dataInput, type: "updateState", }
    typedIpcMain.sendToWindow(mainWindow, "updatePlayerState", data)
    lastKnownPlayerState = data
    sendRemoteUi(data)
}

export type PlayerStatusReport = {
    type: "updateState"
    title: string | null
    isPlaying: boolean,
    time: number,
    maxTime: number
    volume: number
}

const getLocalIpInterfaces = (): Record<string, string[]> => {
    const nets = networkInterfaces();
    const results = {}

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            const familyV4Value = typeof net.family === "string" ? "IPv4" : 4
            if (net.family === familyV4Value && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    return results
}

const getLocalIp = () => {
    return Object.values(getLocalIpInterfaces())[0]?.[0]
}
