import { Link } from "@mui/material"
import React, { useEffect, useState } from "react"
import { typedIpcRenderer } from "typed-ipc"
import { isSettingProxy, setupAppProxy } from "./ElectronEvents"

// eslint-disable-next-line react/display-name
export default () => {
    const [stremioServerStarted, setStremioServerStarted] = useState(false)

    useEffect(() => {
        typedIpcRenderer.addEventListener("stremioServerStatus", (_, { up }) => {
            setStremioServerStarted(up)
        })
        typedIpcRenderer.send("stremioServerStatus", {})
        return () => {
            typedIpcRenderer.removeAllListeners("stremioServerStatus")
        }
    }, []);

    return <div className='flex justify-between px-3'>
        <div></div>
        <div className='flex justify-center mb-5 opacity-90 transition-opacity hover:opacity-100 divide-x-2 divide-gray-600'>
            <Link className='px-2' onClick={() => {
                typedIpcRenderer.send("openSettingsFile", {})
            }}>Edit settings</Link>
            <Link className='px-2' onClick={() => {
                if (isSettingProxy.value) return
                void setupAppProxy()
            }}>Reset proxies (speedup)</Link>
        </div>
        <div><span className='opacity-50'>Stremio server status: </span><span className='opacity-90' title={stremioServerStarted ? "" : "Click to start server"} style={{ color: stremioServerStarted ? "limegreen" : "red" }} onClick={() => {
            if (stremioServerStarted) return
            typedIpcRenderer.send("startStremioServer", {})
        }}>{stremioServerStarted ? "UP" : "DOWN"}</span></div>
    </div>
}
