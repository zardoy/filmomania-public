import { HighlightOff, Menu } from "@mui/icons-material"
import { IconButton, List, ListItemButton } from "@mui/material"
import React, { useState } from "react"
import WithBackButton from "../components/WithBackButton"
import { getPlaybackHistory } from "../playHistory"
import { handleTorrentClick } from "./Movie"
import { playTorrent } from "./TorrentSelectFileDialog"

export const INDEX_START = "#index/";

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
        <List>{[...playbackHistory].reverse().map(({ filmId, entryPath, playbackName, lastTime, magnet }, i) =>
            <ListItemButton key={`${playbackName}${i}`} className='block' onClick={() => {
                playTorrent(magnet, playbackName, entryPath.startsWith(INDEX_START) ? +entryPath.slice(INDEX_START.length) : undefined, undefined, filmId);
            }}>
                <div className='flex justify-between'>
                    <div>{playbackName}</div>
                    <div>{formatter.format(lastTime)} {filmId === undefined && "(external)"} {entryPath !== "/" && <IconButton onClick={e => {
                        e.stopPropagation()
                        void handleTorrentClick({
                            filmId,
                            magnet,
                            title: playbackName
                        });
                    }}><Menu /></IconButton>}</div>
                </div>
            </ListItemButton>)
        }</List>
    </WithBackButton>
}
