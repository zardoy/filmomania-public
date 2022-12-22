import { PlayerInputData } from "../react/electron-shared/ipcSchema";
import { settingsStore } from "../react/electron-shared/settings"

export const getCustomPlayerArgs = ({ playbackName, startTime }: PlayerInputData) => {
    const { customPlayerType, fullscreen } = settingsStore.settings.player;
    if (customPlayerType === "mpv") {
        return [
            `--force-media-title="${playbackName}"`,
            // `--input-ipc-server=`,
            // todo try to autodetect
            // "--audio-spdif=ac3,dts,eac3",
            ...startTime ? [`--start="+0:0:${startTime}"`] : [],
            ...fullscreen ? ["--fullscreen"] : []
        ].join(" ")
    }
    return ""
}
