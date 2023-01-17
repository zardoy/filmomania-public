import { DoubleArrow, HighlightOff, Menu, Pause as PauseIcon, PlayArrow, Power, PowerSettingsNew, RestartAlt, Visibility } from "@mui/icons-material"
import { CssBaseline, List, ListItemButton, Paper, Popover, Slider, Typography } from "@mui/material"
import React, { useEffect, useRef, useState } from "react"
import { proxy, useSnapshot } from "valtio"
import type { PlayerStatusReport } from "../electron/remoteUiControl"

export const uiState = proxy({
    title: null as string | null,
    isPlaying: false,
    time: 0,
    maxTime: 0,
    volume: 0,
    fastSeek: null as null as {
        time: number,
        isBackwards: boolean,
    } | null
})

const websocketUrl = new URL(location.href)
websocketUrl.pathname = "ws"
websocketUrl.protocol = "ws"
if (import.meta.env.DEV) websocketUrl.port = "3720"

let webSocket = new WebSocket(websocketUrl)
let reopenWebsocketInterval
const clearInterval = () => {
    if (reopenWebsocketInterval) {
        window.clearInterval(reopenWebsocketInterval)
        reopenWebsocketInterval = undefined
    }
}
webSocket.onopen = () => {
    clearInterval()
    console.log("ws connected")
}
webSocket.onmessage = e => {
    let data
    try {
        data = JSON.parse(e.data)
        // eslint-disable-next-line no-empty
    } catch { }
    if (!data) return
    const { type, ...rest } = data
    if (type === "updateState") {
        Object.assign(uiState, rest)
    }
}
webSocket.onclose = webSocket.onerror = () => {
    console.log("ws closed.")
    clearInterval()
    reopenWebsocketInterval = setInterval(() => {
        webSocket = new WebSocket(websocketUrl)
    }, 2000)
}

const closeApp = () => {
    sendSocket({ command: "closeApp" })
    uiState.title = null
}

const sendSocket = data => {
    webSocket.send(JSON.stringify(data))
}

const sendMpv = (...args) => {
    webSocket.send(JSON.stringify({ mpv: args }))
}

export const setPlaybackTime = (time: number) => {
    sendMpv("set_property", "playback-time", time)
    // make optimistic ui update
    uiState.time = time
}

const getHours = (time: number) => Math.floor(time / 60 / 60)
const time = (arg: number | string) => arg.toString().padStart(2, "0")

// eslint-disable-next-line react/display-name
export default () => {
    const [tempMovingTime, setTempMovingTime] = useState(undefined as undefined | number)
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const state = useSnapshot(uiState)
    const volumeSlider = useRef<HTMLElement>(null!)
    const PlayPauseComponent = state.isPlaying ? PauseIcon : PlayArrow

    return <div className='root-elem fixed flex w-screen h-full overflow-hidden flex-col justify-between items-center p-2 needsclick'>
        <CssBaseline />
        {state.title === null && <div className='fixed inset-0 z-10 bg-black bg-opacity-50' />}
        <div className='flex justify-between w-full'>
            <h1 className='text-2xl break-words' style={{ width: "calc(100% - 50px)" }}>
                {state.title === null ? "Nothing is playing..." : state.title}
            </h1>
            {/*
            //@ts-ignore */}
            <Menu className='w-14 h-14 float-right z-20' onClick={handleClick} />
            <Popover open={!!anchorEl} anchorEl={anchorEl} onClick={handleClose} anchorOrigin={{ horizontal: "left", vertical: "bottom" }} disablePortal>
                <List className='space-y-2'>
                    <ListItemButton onClick={() => sendSocket({ command: "shutdown" })}><PowerSettingsNew className='mr-1' /> Shutdown PC</ListItemButton>
                    <ListItemButton disabled={state.title === null} onClick={() => sendSocket({ command: "toggleOverlay" })}><Visibility className='mr-1' /> Toggle overlay</ListItemButton>
                    <ListItemButton disabled={state.title === null} onClick={() => sendSocket({ command: "restartPlayer" })}><RestartAlt className='mr-1' /> Restart player</ListItemButton>
                    <ListItemButton onClick={() => closeApp()}><HighlightOff className='mr-1' /> Close app</ListItemButton>
                </List>
            </Popover>
        </div>
        <div className='rounded-full border border-white p-2 relative'>
            <PlayPauseComponent className='w-14 h-14' onClick={e => {
                e.preventDefault()
                sendMpv("cycle", "pause");
            }} />
            {state.fastSeek &&
                <span
                    className='absolute left-0 right-0 text-center'
                    style={{ bottom: -25 }}
                >{state.fastSeek.isBackwards && <DoubleArrow style={{ transform: "rotate(180deg)" }} />} {state.fastSeek.time}s {!state.fastSeek.isBackwards && <DoubleArrow />}</span>}
        </div>
        <div className='w-full px-2'>
            <Slider disabled value={state.volume} max={100} ref={volumeSlider} onChange={(_, val) => uiState.volume = val as number} onChangeCommitted={(_e, val) => console.log(val)} />
            <Slider valueLabelDisplay='on' valueLabelFormat={val => `${time(getHours(val))}:${time(Math.floor(val / 60) % 60)}:${time(val % 60)}`} value={tempMovingTime ?? state.time} max={state.maxTime} size='small' onChange={(_, val) => {
                setTempMovingTime(val as number)
            }} onChangeCommitted={(_e, val) => {
                setPlaybackTime(val as number)
                setTempMovingTime(undefined)
            }} color="secondary" />
        </div>
    </div>
}
