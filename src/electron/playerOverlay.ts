import { getFileFromPublic } from "@zardoy/electron-esbuild/build/client"
import { BrowserWindow } from "electron"

export const playerOverlay = async () => {
    const browserWindow = new BrowserWindow({
        show: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        fullscreen: true,
    })
    browserWindow.showInactive()
    await browserWindow.loadFile(getFileFromPublic("./overlay.html"))
    browserWindow.setIgnoreMouseEvents(true)

    return browserWindow
}
