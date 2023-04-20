import { History } from "@mui/icons-material"
import { IconButton, Link } from "@mui/material"
import React, { useEffect, useState } from "react"
import { typedIpcRenderer } from "typed-ipc"
import { isSettingProxy, setupAppProxy } from "./ElectronEvents"
import { useHistory } from "react-router-dom"
import { settingsStore } from "../electron-shared/settings"

// eslint-disable-next-line react/display-name
export default () => {
    const [stremioServerStarted, setStremioServerStarted] = useState(false)
    const [remoteUiServer, setRemoteUiServer] = useState(settingsStore.settings.player.remoteUiControl ? "down" : "Disabled. Enable in settings: player.remoteUiControl")
    const history = useHistory()

    useEffect(() => {
        typedIpcRenderer.addEventListener("stremioServerStatus", (_, { up }) => {
            setStremioServerStarted(up)
        })
        typedIpcRenderer.addEventListener("remoteUiServerStatus", (_, { up, ip }) => {
            setRemoteUiServer(up ? ip ?? "<unknown>" : "down")
        })
        typedIpcRenderer.send("sendServersStatus", {})
        return () => {
            typedIpcRenderer.removeAllListeners("stremioServerStatus")
            typedIpcRenderer.removeAllListeners("remoteUiServerStatus")
        }
    }, []);

    return <div className='flex justify-between px-3 center-all-flex'>
        <div>
            <IconButton title="Playback history" onClick={() => history.push("/playbackHistory")}>
                <History />
            </IconButton>
        </div>
        <div className='flex justify-center mb-5 opacity-90 transition-opacity hover:opacity-100 divide-x-2 divide-gray-600'>
            <Link className='px-2' onClick={() => {
                typedIpcRenderer.send("openSettingsFile", {})
            }}>Edit settings</Link>
            <Link className='px-2' onClick={() => {
                if (isSettingProxy.value) return
                void setupAppProxy()
            }}>Reset proxies (speedup)</Link>
        </div>
        <div className='flex flex-row-reverse'>
            <div>
                <div title={`Remote server ip ${remoteUiServer}`} className='align-baseline mr-1' style={{ display: "inline-block", width: 17, height: 17, borderRadius: "100%", background: remoteUiServer ? "limegreen" : "red" }} />
                <span className='opacity-50'>Stremio server status: </span><span className='opacity-90' title={stremioServerStarted ? "Click to kill server" : "Click to start server"} style={{ color: stremioServerStarted ? "limegreen" : "red" }} onClick={() => {
                    if (stremioServerStarted) {
                        typedIpcRenderer.send("killStremioServer", {})
                    } else {
                        typedIpcRenderer.send("startStremioServer", {})
                    }
                }}>{stremioServerStarted ? "UP" : "DOWN"}</span>
            </div>
        </div>
    </div>
}
