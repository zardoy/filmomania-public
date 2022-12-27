import { getFileFromPublic } from "@zardoy/electron-esbuild/build/client"
import { BrowserWindow } from "electron"

export const playerOverlay = async (coord: Partial<{ x, y }> = {}) => {
    const browserWindow = new BrowserWindow({
        show: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        fullscreen: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
        focusable: false,
        ...coord
    })
    // osc-visibility
    browserWindow.showInactive()
    await browserWindow.loadFile(getFileFromPublic("./overlay.html"))
    browserWindow.setIgnoreMouseEvents(true)

    return browserWindow
}
