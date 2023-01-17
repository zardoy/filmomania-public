import { typedIpcRenderer } from "typed-ipc";
import { settingsStore } from "./electron-shared/settings";

export const bindPlayerStateListeners = () => {
    typedIpcRenderer.addEventListener("updatePlayerState", (_e, { time }) => {
        const playingId = sessionStorage.getItem("currentPlayingId");
        if (!playingId || time <= 0 || !settingsStore.settings.player.rememberFilmPosition) return
        const filmsHistory = getFilmsHistory()
        filmsHistory[playingId] ??= {
            first: Date.now(),
            last: 0,
            time: 0,
        }
        filmsHistory[playingId]!.last = Date.now()
        filmsHistory[playingId]!.time = time
        localStorage.setItem("filmsHistory", JSON.stringify(filmsHistory))
    })
}

interface FilmsHistory {
    [id: string]: {
        first: number
        last: number
        /** in secs */
        time: number
    }
}

export const getFilmsHistory = () => {
    const filmsHistory = localStorage.getItem("filmsHistory");
    if (!filmsHistory) return {}
    return JSON.parse(filmsHistory) as FilmsHistory
}

export const getPlaybackHistory = () => {
    const playbackHistory = localStorage.getItem("playbackHistory");
    if (!playbackHistory) return []
    return JSON.parse(playbackHistory) as PlaybackHistoryEntry[]
}

export const addPlaybackHistoryEntry = (data: PlaybackHistoryEntry) => {
    const newArr = [...getPlaybackHistory(), data].slice(-150)
    localStorage.setItem("playbackHistory", JSON.stringify(newArr))
}

interface PlaybackHistoryEntry {
    filmId?: string
    lastTime: number
    magnet: string
    entryPath: string
    playbackName: string
}
