import { app } from "electron"
import { existsSync } from "fs"
import { join } from "path"

export interface HooksFile {
    mpvStarted(socket, additionalData: {
        observeProperty(prop: string, callback: (data) => any)
        onClose(callback: () => any)
    })
}

export let hooksFile: HooksFile | undefined
const hooksFilePath = join(app.getPath("userData"), "./hooks-file.js")

export const initHooksFile = () => {
    if (!existsSync(hooksFilePath)) return false
    delete require.cache[require.resolve(hooksFilePath)]
    hooksFile = require(hooksFilePath)
    return true
}
