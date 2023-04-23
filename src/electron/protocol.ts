import { app, } from "electron"
import { settingsStore } from "../react/electron-shared/settings"
import { typedIpcMain } from "typed-ipc"
import { mainWindow } from "./mainWindow"

const nativeProtocol = "filmomania";
export const registerProtocol = () => {
    const magnetProtocol = "magnet";
    app.setAsDefaultProtocolClient(nativeProtocol, process.execPath, [__filename])
    if (settingsStore.settings.core.handleMagnetProtocol) {
        const registered = app.setAsDefaultProtocolClient(magnetProtocol, process.execPath, [__filename])
        console.log("Registered magnet protocol", registered)
    } else {
        app.removeAsDefaultProtocolClient(magnetProtocol)
    }
    app.on("second-instance", (_e, argv) => {
        handleArgv(argv)
    })
}

export const handleArgv = (argv: string[] | undefined) => {
    argv ??= process.argv
    const protocolStart = `${nativeProtocol}://`;
    const openAction = argv.find(x => x.startsWith(protocolStart))
    const magnetAction = argv.find(x => x.startsWith("magnet:"))
    if (openAction) {
        const route = openAction.slice(`${protocolStart}`.length)
        typedIpcMain.sendToWindow(mainWindow!, "openRoute", { url: route })
    }
    if (magnetAction) {
        typedIpcMain.sendToWindow(mainWindow!, "playManget", { magnet: magnetAction })
            mainWindow!.focus()
    }
}
