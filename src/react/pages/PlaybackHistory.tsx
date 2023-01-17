import { HighlightOff } from "@mui/icons-material"
import { IconButton, List, ListItemButton } from "@mui/material"
import React, { useState } from "react"
import WithBackButton from "../components/WithBackButton"
import { getPlaybackHistory } from "../playHistory"
import { playTorrent } from "./TorrentSelectFileDialog"

// eslint-disable-next-line react/display-name
export default () => {
    const [playbackHistory, setPlaybackHistory] = useState(getPlaybackHistory())
    const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" })

    return <WithBackButton>
        <div className='flex justify-between'>
            <div>Playback history</div>
            <IconButton
                title='Clear playback history'
                onClick={() => {
                    localStorage.removeItem("playbackHistory")
                    setPlaybackHistory([])
                }}>
                <HighlightOff />
            </IconButton>
        </div>
        <List>{playbackHistory.map(({ filmId, entryPath, playbackName, lastTime, magnet }, i) =>
            <ListItemButton key={`${playbackName}${i}`} className='block' onClick={() => playTorrent(magnet, playbackName, entryPath.startsWith("#index/") ? +entryPath.slice("#index/".length) : undefined, undefined)}>
                <div className='flex justify-between'>
                    <div>{playbackName}</div>
                    <div>{formatter.format(lastTime)} {filmId === undefined && "(external)"}</div>
                </div>
            </ListItemButton>)
        }</List>
    </WithBackButton>
}
