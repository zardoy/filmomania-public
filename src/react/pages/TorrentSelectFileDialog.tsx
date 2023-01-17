import { Dialog, DialogTitle, Fade, ListItemButton } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import ButtonsList from "../components/ButtonsList";
import { proxy, useSnapshot } from "valtio";
import filesize from "filesize";
import { TorrentStatsResponse } from "../../electron/requests/torrentInfo";
import { typedIpcRenderer } from "typed-ipc";
import _ from "lodash";
import { addPlaybackHistoryEntry } from "../playHistory";

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
    const data = useSnapshot(torrentSelectFilesData);

    const { t } = useTranslation();

    if (!data.value) return null;

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
                {data.value.files.map((file, i) => {
                    return <ListItemButton key={file.path}
                        // tech limitation?
                        onClick={() => playTorrent(data.value!.magnet, file.path, file["index"])} className="block">
                        <div className='flex justify-between w-full'>
                            <span>
                                <span className='text-gray-600'>{i + 1}.</span> {file.name}
                            </span>
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

let selectedFilmId: string | undefined

export const handleTorrentOpen = (data: TorrentDisplayData, resumeTimeIfSingle?: number, singleFileCallback?: () => any) => {
    selectedFilmId = data.filmId
    const alwaysDisplaySelector = false
    // printing for advanced use cases or debugging
    console.log("torrentInfo", data)
    // if (files.length === 0) todo display err
    data.files = _.sortBy(data.files.map((file, index) => ({ ...file, index }))
        .filter(file => ignoreFilesExtensions.every(ext => !file.name.endsWith(ext))), ({ path }) => path)
    if (!alwaysDisplaySelector && data.files.length === 1) {
        singleFileCallback?.()
        playTorrent(data.magnet, data.name, undefined, resumeTimeIfSingle)
    } else {
        torrentSelectFilesData.value = data
    }
}

export const playTorrent = (magnet: string, playbackName: string, playIndex = 0, resumeTime?: number) => {
    addPlaybackHistoryEntry({
        entryPath: playIndex === 0 ? "/" : playbackName, magnet, filmId: selectedFilmId, lastTime: Date.now(), playbackName
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
