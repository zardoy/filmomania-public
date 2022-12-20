import { app, } from "electron"

export const registerProtocol = () => {
    const locked = app.requestSingleInstanceLock()
    if (!locked) {
        app.quit()
        return
    }

    const protocolHandle = "filmomania";
    app.setAsDefaultProtocolClient(protocolHandle, process.execPath, [process.execArgv[1]!])
    app.on("second-instance", (e, argv) => {
        const protocolStart = `${protocolHandle}://`;
        const openAction = argv.find(x => x.startsWith(protocolStart))
        if (openAction) {
            const film = +openAction.slice(`${protocolStart}film/`.length)
            console.log("open", film)
        }
    })
}
