import { Download as DownloadIcon, FolderOpen, Link as LinkIcon, OpenInBrowser as OpenInNew } from "@mui/icons-material";
import { CircularProgress, Typography, Grid, Alert, ListItem, Menu, } from "@mui/material";
import { shell } from "electron";
import _ from "lodash";
import { bindMenu, } from "material-ui-popup-state/hooks";
import { usePopupState } from "material-ui-popup-state/hooks";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams, } from "react-router-dom";
import { useAsync } from "react-use";
import { typedIpcRenderer } from "typed-ipc";
import CenterContent from "../components/CenterContent";
import ContextMenu from "../components/ContextMenu";
import { settingsStore } from "../electron-shared/settings";
import { TorrentItem } from "../electron-shared/TorrentTypes";
import { getFilmData } from "../utils/search-engine";
import ButtonsList from "../components/ButtonsList";
import { typedIpcRequest } from "../utils/ipc";
import { currentModalCancel, showModalLoader } from "./Root";
import { handleTorrentOpen, } from "./TorrentSelectFileDialog";
import { getFilmsHistory } from "../playHistory";
import { TorrentStatsResponse } from "../../electron/requests/torrentInfo";

interface ComponentProps {
}


let abortController = new AbortController()
const FilmPage: React.FC<ComponentProps> = () => {
    const { search } = useLocation()

    const { t } = useTranslation()

    const { filmId: selectedFilmId } = useParams<{ filmId: string; }>();
    const [filmData, setFilmData] = useState(null as Awaited<ReturnType<typeof getFilmData>> | null)

    useMemo(() => {
        abortController = new AbortController()
    }, [])

    const state = useAsync(async () => {
        // defer fetching
        await new Promise(resolve => {
            setTimeout(resolve, 0)
        })
        const data = await getFilmData(+selectedFilmId, abortController.signal)
        setFilmData(data)
        try {
            const { cleanName, year, nameOriginal } = data
            const mainQuery = settingsStore.settings.providers.rutorInfoSearchQuery.replaceAll("${ruEnName}", cleanName).replaceAll("${enRuName}", nameOriginal || cleanName).replaceAll("${year}", year)
            const result = await typedIpcRequest.torrentsList({
                searchQuery: search.includes("altSearch=1") ? `${nameOriginal} ${year}` : mainQuery
            });
            return result.parseResult;
        } catch (err: any) {
            throw new Error(t("tracket-get-result-fail").replace("{0}", err.message));
        }
    }, []);

    useEffect(() => {
        return () => {
            abortController.abort()
        }

        return () => {
            showModalLoader.value = false
        }
    }, []);

    const contextmenuState = usePopupState({ variant: "popover", popupId: "torrentMoreOptions" });

    const [contextmenuTorrent, setContextmenuTorrent] = useState<TorrentItem | null>(null);

    return !state.value || !filmData ?
        <CenterContent>
            {
                state.loading ? <CircularProgress /> :
                    <>
                        <Typography color="error">{state.error?.message}</Typography>
                    </>
            }
        </CenterContent> :
        <Grid container direction="column">
            <Menu
                {...bindMenu(contextmenuState)}
            >
                <ContextMenu
                    items={[
                        {
                            label: t("open-torrent-page"),
                            action() {
                                void shell.openExternal(contextmenuTorrent!.pageURL);
                            },
                            icon: <OpenInNew />
                        },
                        {
                            label: t("open-magnet-with-native-app"),
                            action() {
                                void shell.openExternal(contextmenuTorrent!.magnet);
                            },
                            icon: <LinkIcon />
                        },
                        {
                            label: t("open-torrent-file"),
                            action() {
                                typedIpcRenderer.send("downloadTorrentFile", {
                                    torrentFileUrl: contextmenuTorrent!.torrentURL
                                });
                            },
                            icon: <FolderOpen />
                        },
                        {
                            label: t("Download via browser"),
                            async action() {
                                const stremioStreamingLink = await typedIpcRequest.getStremioStreamingLink({ magnet: contextmenuTorrent!.magnet })
                                void shell.openExternal(stremioStreamingLink);
                            },
                            icon: <DownloadIcon />
                        },
                    ]}
                    onClose={contextmenuState.close}
                />
            </Menu>
            <Typography variant="h4">{t("results-from-rutor-info")} {state.value.totalResults}</Typography>
            {
                state.value.hiddenResults > 0 &&
                <Alert severity="warning">{t("we-have-hidden-results")} {state.value.hiddenResults}</Alert>
            }
            <div className='fixed inset-0 -z-10 bg-no-repeat bg-cover bg-black' style={{ opacity: 0.85 }} />
            <div className='fixed inset-0 -z-20 bg-no-repeat bg-cover overridable-cover' style={{ backgroundImage: filmData.imdbId ? `url("https://images.metahub.space/background/big/${filmData.imdbId}/img")` : `url("${filmData.coverUrl}")` }} />
            <ButtonsList>{
                state.value.results.length ?
                    _.sortBy(state.value.results, o => {
                        return settingsStore.settings.ui.trackerSorting === "bySize" ? o.sizeInBytes : o.seeders;
                    }).reverse().map(item => {
                        const { title, magnet, torrentID, seeders, displaySize, pageURL, torrentURL } = item
                        const handleTorrentClick = async () => {
                            showModalLoader.value = true
                            const data = await Promise.race<TorrentStatsResponse>([
                                typedIpcRequest.getTorrentInfo({ magnet }).finally(() => {
                                    showModalLoader.value = false
                                }),
                                new Promise(resolve => {
                                    currentModalCancel.value = () => {
                                        resolve(null as any)
                                    }
                                })
                            ])
                            currentModalCancel.value = null
                            showModalLoader.value = false
                            if (data === null) return
                            if (!data) throw new Error("No torrent data (most probably it doesn't exist)")
                            sessionStorage.removeItem("currentPlayingId")
                            handleTorrentOpen({ ...data, magnet, name: title, filmId: selectedFilmId, }, getFilmsHistory()[selectedFilmId]?.time, () => {
                                sessionStorage.setItem("currentPlayingId", selectedFilmId)
                                const playerExitHandler = () => {
                                    sessionStorage.removeItem("currentPlayingId")
                                    typedIpcRenderer.removeEventListener("playerExit", playerExitHandler)
                                };
                                typedIpcRenderer.addEventListener("playerExit", playerExitHandler)
                            })
                        }

                        const contextMenu = (event: React.MouseEvent<HTMLElement>) => {
                            setContextmenuTorrent(item);
                            contextmenuState.open(event);
                        };
                        return <ListItem key={torrentID} divider button onClick={() => handleTorrentClick()} onContextMenu={contextMenu}>
                            <div className="flex flex-nowrap justify-between w-full">
                                <Typography>{title}</Typography>
                                <div className='flex'>
                                    <Typography style={{ color: seeders === 0 ? "red" : seeders < 8 ? "yellow" : "limegreen" }}>{seeders}</Typography>
                                    <Typography style={{ marginLeft: 15 }}>{displaySize}</Typography>
                                </div>
                            </div>
                        </ListItem>;
                    })
                    : <Typography>{t("tracker-no-results")}</Typography>
            }</ButtonsList>
        </Grid>;
    return null;
};

export default FilmPage;
