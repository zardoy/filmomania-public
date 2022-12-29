import { getFileFromPublic } from "@zardoy/electron-esbuild/build/client"
import { BrowserWindow } from "electron"

export const playerOverlay = async (coord: Partial<{ x, y }> = {}) => {
    const browserWindow = new BrowserWindow({
        // show: false,
        // skipTaskbar: true,
        focusable: false,
        frame: false,
        fullscreen: true,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
        ...coord
    })
    // osc-visibility
    browserWindow.setIgnoreMouseEvents(true)
    await browserWindow.loadFile(getFileFromPublic("./overlay.html"))
    // browserWindow.showInactive()

    return browserWindow
}
