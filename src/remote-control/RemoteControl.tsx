import { DoubleArrow, HighlightOff, Menu, Pause as PauseIcon, PlayArrow, Power, PowerSettingsNew, RestartAlt, Visibility, PlayCircleOutline, Link as LinkIcon } from "@mui/icons-material"
import { CssBaseline, List, ListItemButton, Paper, Popover, Slider, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, ListItem, ListItemText, IconButton, Chip } from "@mui/material"
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
    } | null,
    playlist: null as {
        files: Array<{
            name: string
            path: string
            length: number
            index: number
        }>
        currentIndex: number
        magnet: string
    } | null
})

const torrentDialogState = proxy({
    open: false,
    magnetInput: "",
    torrentInfo: null as any,
    loading: false,
    error: ""
})

const playlistDialogState = proxy({
    open: false
})

let requestId = 0

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
        // Handle playlist data if present
        if (rest.playlist) {
            uiState.playlist = rest.playlist
        }
    } else if (type === "torrentInfo") {
        if (rest.error) {
            torrentDialogState.error = rest.error
        } else {
            torrentDialogState.torrentInfo = rest.data
        }
        torrentDialogState.loading = false
    } else if (type === "streamingUrl") {
        if (rest.error) {
            alert(`Error getting streaming URL: ${ rest.error}`)
        } else {
            const url = new URL(rest.url)
            url.hostname = window.location.hostname
            navigator.clipboard.writeText(url.toString()).then(() => {
                alert("Streaming URL copied to clipboard!")
            }).catch(() => {
                prompt("Copy this streaming URL:", url.toString())
            })
        }
    } else if (type === "playlist") {
        if (rest.error) {
            console.log("Playlist error:", rest.error)
        } else if (rest.data) {
            uiState.playlist = rest.data
        }
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
    uiState.playlist = null
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

const getTorrentInfo = (magnet: string) => {
    const currentRequestId = ++requestId
    torrentDialogState.loading = true
    torrentDialogState.error = ""
    torrentDialogState.torrentInfo = null
    sendSocket({
        command: "getTorrentInfo",
        magnet,
        requestId: currentRequestId
    })
}

const playTorrent = (magnet: string, playIndex = 0, playbackName = "Remote Torrent") => {
    sendSocket({
        command: "playTorrent",
        magnet,
        playIndex,
        data: {
            playbackName,
            startTime: 0
        }
    })
    torrentDialogState.open = false
}

const getStreamingUrl = (magnet: string, playIndex = 0) => {
    const currentRequestId = ++requestId
    sendSocket({
        command: "getStreamingUrl",
        magnet,
        playIndex,
        requestId: currentRequestId
    })
}

const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100 } ${ sizes[i]}`
}

// History checking functions for remote UI
const hasFileBeenPlayed = (magnet: string, fileIndex: number): boolean => {
    const history = JSON.parse(localStorage.getItem("playbackHistory") || "[]")
    return history.some((entry: any) =>
        entry.magnet === magnet &&
        entry.entryPath === (fileIndex === 0 ? "/" : `#index/${fileIndex}`)
    )
}

const getLastPlayedFileIndex = (magnet: string): number | null => {
    const history = JSON.parse(localStorage.getItem("playbackHistory") || "[]")
    const lastEntry = history
        .filter((entry: any) => entry.magnet === magnet)
        .sort((a: any, b: any) => b.lastTime - a.lastTime)[0]

    if (!lastEntry) return null

    if (lastEntry.entryPath === "/") return 0
    if (lastEntry.entryPath.startsWith("#index/")) {
        return parseInt(lastEntry.entryPath.slice("#index/".length))
    }
    return null
}

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
    const torrentState = useSnapshot(torrentDialogState)
    const playlistState = useSnapshot(playlistDialogState)
    const volumeSlider = useRef<HTMLElement>(null!)
    const PlayPauseComponent = state.isPlaying ? PauseIcon : PlayArrow

    const handleMagnetSubmit = () => {
        if (!torrentState.magnetInput.trim()) return
        getTorrentInfo(torrentState.magnetInput.trim())
    }

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
                    <ListItemButton onClick={() => {
                        torrentDialogState.open = true
                        handleClose()
                    }}><PlayCircleOutline className='mr-1' /> Play Torrent/Magnet</ListItemButton>
                    <ListItemButton onClick={() => sendSocket({ command: "shutdown" })}><PowerSettingsNew className='mr-1' /> Shutdown PC</ListItemButton>
                    <ListItemButton disabled={state.title === null} onClick={() => sendSocket({ command: "toggleOverlay" })}><Visibility className='mr-1' /> Toggle overlay</ListItemButton>
                    <ListItemButton disabled={state.title === null} onClick={() => sendSocket({ command: "restartPlayer" })}><RestartAlt className='mr-1' /> Restart player</ListItemButton>
                    <ListItemButton disabled={!state.playlist} onClick={() => {
                        playlistDialogState.open = true
                        handleClose()
                    }}><PlayCircleOutline className='mr-1' /> Show Playlist</ListItemButton>
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

        <Dialog open={torrentState.open} onClose={() => torrentDialogState.open = false} maxWidth="md" fullWidth>
            <DialogTitle>Play Torrent/Magnet</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Magnet link or torrent URL"
                    placeholder="magnet:?xt=urn:btih:..."
                    value={torrentState.magnetInput}
                    onChange={e => torrentDialogState.magnetInput = e.target.value}
                    margin="normal"
                    multiline
                    rows={3}
                />
                {torrentState.error &&
                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        {torrentState.error}
                    </Typography>
                }
                {torrentState.loading &&
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Loading torrent information...
                    </Typography>
                }
                {torrentState.torrentInfo &&
                    <div style={{ marginTop: 16 }}>
                        <Typography variant="h6" gutterBottom>
                            {torrentState.torrentInfo.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Files: {torrentState.torrentInfo.files?.length || 0}
                        </Typography>
                        <List dense>
                            {torrentState.torrentInfo.files?.map((file, index) =>
                                <ListItem key={index} divider>
                                    <ListItemText
                                        primary={file.name}
                                        secondary={formatFileSize(file.length)}
                                    />
                                    <IconButton
                                        color="primary"
                                        onClick={() => playTorrent(torrentState.magnetInput, index, file.name)}
                                        title="Play on host machine"
                                    >
                                        <PlayCircleOutline />
                                    </IconButton>
                                    <IconButton
                                        color="secondary"
                                        onClick={() => getStreamingUrl(torrentState.magnetInput, index)}
                                        title="Copy streaming URL"
                                    >
                                        <LinkIcon />
                                    </IconButton>
                                </ListItem>
                            )}
                        </List>
                    </div>
                }
            </DialogContent>
            <DialogActions>
                <Button onClick={() => torrentDialogState.open = false}>Cancel</Button>
                {!torrentState.torrentInfo &&
                    <Button
                        onClick={handleMagnetSubmit}
                        disabled={!torrentState.magnetInput.trim() || torrentState.loading}
                        variant="contained"
                    >
                        Load Torrent
                    </Button>
                }
            </DialogActions>
        </Dialog>

        {/* Playlist Dialog */}
        <Dialog open={playlistDialogState.open} onClose={() => playlistDialogState.open = false} maxWidth="md" fullWidth>
            <DialogTitle>Current Playlist</DialogTitle>
            <DialogContent>
                {state.playlist ? (
                    <div>
                        <Typography variant="h6" gutterBottom>
                            {state.playlist.files.length} files in playlist
                        </Typography>
                        <List dense>
                            {state.playlist.files.map((file, index) => {
                                const hasBeenPlayed = hasFileBeenPlayed(state.playlist!.magnet, index);
                                const isLastPlayed = getLastPlayedFileIndex(state.playlist!.magnet) === index;

                                return (
                                    <ListItem
                                        key={index}
                                        divider
                                        sx={{
                                            backgroundColor: index === state.playlist!.currentIndex ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                            borderLeft: index === state.playlist!.currentIndex ? '4px solid #1976d2' : 'none'
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span style={{ marginRight: 8, fontWeight: index === state.playlist!.currentIndex ? 'bold' : 'normal' }}>
                                                        {index + 1}.
                                                    </span>
                                                    <span style={{ fontWeight: index === state.playlist!.currentIndex ? 'bold' : 'normal' }}>
                                                        {file.name}
                                                    </span>
                                                    {index === state.playlist!.currentIndex && (
                                                        <span style={{ marginLeft: 8, fontSize: '0.8em', color: '#1976d2' }}>
                                                            (Now Playing)
                                                        </span>
                                                    )}
                                                    {hasBeenPlayed && (
                                                        <Chip
                                                            label="Played"
                                                            size="small"
                                                            color="success"
                                                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    )}
                                                    {isLastPlayed && index !== state.playlist!.currentIndex && (
                                                        <Chip
                                                            label="Last"
                                                            size="small"
                                                            color="primary"
                                                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    )}
                                                </div>
                                            }
                                            secondary={formatFileSize(file.length)}
                                        />
                                        <IconButton
                                            color="primary"
                                            onClick={() => {
                                                playTorrent(state.playlist!.magnet, file.index, file.name)
                                                playlistDialogState.open = false
                                            }}
                                            title="Play this file"
                                        >
                                            <PlayCircleOutline />
                                        </IconButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </div>
                ) : (
                    <Typography variant="body2" color="textSecondary">
                        No playlist available
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => playlistDialogState.open = false}>Close</Button>
            </DialogActions>
        </Dialog>
    </div>
}
