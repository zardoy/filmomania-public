import { shell } from "electron";
import { IpcMainEventListener, } from "typed-ipc";
import { settingsStore } from "../../react/electron-shared/settings";
import { exec } from "child_process"
import { getStremioExecPath, getStremioStremaingUrlFromTorrent } from "../stremio";
import { getCustomPlayerArgs } from "../customPlayerArgs";

export default (async (_, { magnet, data }) => {
    const { settings } = settingsStore
    // todo ensure errors poppin up
    const { player } = settings;
    if (player.defaultPlayer === "stremio") {
        const stremioExecPath = getStremioExecPath()
        exec(`"${stremioExecPath}" "${magnet}"`)
    } else if (player.defaultPlayer === "custom") {
        let prog = player.customPlayerExecutable;
        if (!prog) throw new Error("defaultPlayer is custom, but customPlayerExecutable is missing in settings")
        if (!prog.includes("\"")) prog = `"${prog}"`
        const stremioStremaingUrl = await getStremioStremaingUrlFromTorrent(magnet)
        const playerArgs = getCustomPlayerArgs(data)
        const execCommand = `${prog} "${stremioStremaingUrl}" ${playerArgs}`;
        console.log("execCommand", execCommand)
        exec(execCommand)
        return
    } else {
        await shell.openExternal(magnet)
    }
}) satisfies IpcMainEventListener<"playTorrent">;
