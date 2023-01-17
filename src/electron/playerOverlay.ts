import { getFileFromPublic } from "@zardoy/electron-esbuild/build/client"
import { BrowserWindow } from "electron"
import electronIsDev from "electron-is-dev"
import { join } from "path"

export const playerOverlay = async (coord: Partial<{ x, y }> = {}) => {
    const browserWindow = new BrowserWindow({
        alwaysOnTop: true,
        focusable: false,
        frame: false,
        transparent: true,
        fullscreen: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
        ...coord
    })
    // osc-visibility
    browserWindow.setIgnoreMouseEvents(true)
    await browserWindow.loadFile(electronIsDev ? getFileFromPublic("./overlay.html") : getFileFromUnpacked("./dist/overlay.html"))
    // browserWindow.showInactive()

    return browserWindow
}

export const getFileFromUnpacked = (path: string,) => {
    return join(__dirname, "../../app.asar.unpacked/", path)
}
