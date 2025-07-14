import { Dialog, DialogTitle, Fade, ListItemButton, Chip } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import ButtonsList from "../components/ButtonsList";
import { proxy, useSnapshot } from "valtio";
import filesize from "filesize";
import { TorrentStatsResponse } from "../../electron/requests/torrentInfo";
import { typedIpcRenderer } from "typed-ipc";
import _ from "lodash";
import { addPlaybackHistoryEntry, hasFileBeenPlayed, getLastPlayedFileIndex } from "../playHistory";
import { INDEX_START } from "./PlaybackHistory";

type TorrentDisplayData = Pick<TorrentStatsResponse, "files"> & { magnet: string, name: string, filmId: string | undefined }

export const torrentSelectFilesData = proxy({ value: null as (TorrentDisplayData) | null })

// eslint-disable-next-line react/display-name
const FadeTransition = React.forwardRef((
    props: {
        children: React.ReactElement<any, any>;
    } & Record<string, any>,
    ref: React.Ref<unknown>,
) => {
    return <Fade ref={ref} {...props} />;
});

export const TorrentSelectFileDialog = () => {
    const { value } = useSnapshot(torrentSelectFilesData);

    const { t } = useTranslation();

    if (!value) return null;

    return <Dialog
        maxWidth="lg"
        open={true}
        classes={{
            paper: "mui-dialog",
        }}
        onClose={() => torrentSelectFilesData.value = null}
        container={() => document.querySelector("#root")}
        TransitionComponent={FadeTransition}>
        <DialogTitle>{t("Select file to play")}</DialogTitle>
        <div>
            <ButtonsList>
                {value.files.map((file, i) => {
                    const index = file['index']
                    const hasBeenPlayed = hasFileBeenPlayed(value!.magnet, index);
                    const isLastPlayed = getLastPlayedFileIndex(value!.magnet) === index;

return <ListItemButton key={file.path}
                        // tech limitation?
                        onClick={() => playTorrent(value!.magnet, file.path, index, undefined, value?.filmId)}
                        className="block"
                        sx={{
                            backgroundColor: isLastPlayed ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            borderLeft: isLastPlayed ? '4px solid #1976d2' : 'none'
                        }}>
                        <div className='flex justify-between w-full items-center'>
                            <div className='flex items-center'>
                                <span className='text-gray-600 mr-2'>{i + 1}.</span>
                                <span>{file.name}</span>
                                {hasBeenPlayed && (
                                    <Chip
                                        label="Played"
                                        size="small"
                                        color="success"
                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                    />
                                )}
                                {isLastPlayed && (
                                    <Chip
                                        label="Last"
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                    />
                                )}
                            </div>
                            <span className='text-gray-400 pl-3'>{filesize(file.length)}</span>
                        </div>
                        <small style={{ fontSize: "0.74em" }} className="text-muted">{file.path.slice(0, -file.name.length)}</small>
                    </ListItemButton>;
                })}
                <div></div>
            </ButtonsList>
        </div>
    </Dialog>;
};

const ignoreFilesExtensions = [".srt"]

export const handleTorrentOpen = (data: TorrentDisplayData, resumeTimeIfSingle?: number, singleFileCallback?: () => any) => {
    const alwaysDisplaySelector = false
    // printing for advanced use cases or debugging
    console.log("torrentInfo", data)
    // if (files.length === 0) todo display err
    data.files = _.sortBy(data.files.map((file, index) => ({ ...file, index }))
        .filter(file => ignoreFilesExtensions.every(ext => !file.name.endsWith(ext))), ({ path }) => path)
    if (!alwaysDisplaySelector && data.files.length === 1) {
        singleFileCallback?.()
        playTorrent(data.magnet, data.name, undefined, resumeTimeIfSingle, data.filmId)
    } else {
        torrentSelectFilesData.value = data
    }
}

export const playTorrent = (magnet: string, playbackName: string, playIndex = 0, resumeTime?: number, filmId?: string) => {
    addPlaybackHistoryEntry({
        entryPath: playIndex === 0 ? "/" : `${INDEX_START}${playIndex}`, magnet, filmId, lastTime: Date.now(), playbackName
    })
    typedIpcRenderer.send("playTorrent", {
        playIndex,
        magnet,
        data: {
            playbackName,
            startTime: resumeTime,
        },
    });
};
