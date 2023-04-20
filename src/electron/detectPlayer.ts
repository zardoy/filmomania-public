import * as fs from "fs"

import { homedir } from "os"
import { join } from "path"

export const getBestMpvPlayer = () => {
    let paths: string[] | undefined
    if (process.platform === "win32") {
        const basePaths = [
            "C:/Program Files",
            "C:/Program Files (x86)",
            join(homedir(), "Documents"),
            join(homedir(), "Desktop"),
        ]
        paths = ["mpv.net/mpvnet.exe", "mpv/mpv.exe"].flatMap(path => basePaths.map(basePath => join(basePath, path)))
    } else if (process.platform === "darwin") {
        paths = [
            "/Applications/IINA.app/Contents/MacOS/iina-cli"
        ]
    }

    if (!paths) return

    for (const path of paths) {
        if (fs.existsSync(path)) {
            return path
        }
    }
    return
}
