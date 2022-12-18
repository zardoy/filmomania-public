import { shell } from "electron";
import { IpcMainEventListener, } from "typed-ipc";
import { settingsStore } from "../../react/electron-shared/settings";
import { exec } from "child_process"
import parseTorrent from "parse-torrent"
import { ensureStremioServerIsStarted, getStremioExecPath } from "../stremio";

export default (async (_, {magnet}) => {
    const { settings } = settingsStore
    const {infoHash} = parseTorrent(magnet)
    // todo ensure errors poppin up
    if (!infoHash) throw new Error("Missing infoHash from provided magnet")
    const { player } = settings;
    if (player.defaultPlayer === "stremio") {
        const stremioExecPath = getStremioExecPath()
        exec(`"${stremioExecPath}" "${magnet}"` )
    } else if (player.defaultPlayer === "custom") {
        let prog = player.customPlayerExecutable;
        if (!prog) throw new Error("defaultPlayer is custom, but customPlayerExecutable is missing in settings")
        if (!prog.includes("\"")) prog = `"${prog}"`
        const {stremioServerUrl} = player;
        await ensureStremioServerIsStarted(stremioServerUrl)
        exec(`${prog} "${stremioServerUrl.replace(/\/$/, "")}/${infoHash}/0"`)
        return
    } else {
        await shell.openExternal(magnet)
    }
}) satisfies IpcMainEventListener<"playTorrent">;
