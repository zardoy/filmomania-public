import { Download as DownloadIcon, FolderOpen, Link as LinkIcon, OpenInBrowser as OpenInBrowserIcon, OpenInNew } from "@mui/icons-material";
import { CircularProgress, Typography, Grid, Paper, ClickAwayListener, MenuList, ListItemIcon, Alert, List, ListItem, MenuItem, Menu, } from "@mui/material";
import { shell } from "electron";
import _ from "lodash";
import { bindMenu, } from "material-ui-popup-state/hooks";
import { usePopupState } from "material-ui-popup-state/hooks";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, } from "react-router-dom";
import { useAsync } from "react-use";
import { typedIpcRenderer } from "typed-ipc";
import CenterContent from "../components/CenterContent";
import ContextMenu from "../components/ContextMenu";
import { settingsStore } from "../electron-shared/settings";
import { TorrentItem } from "../electron-shared/TorrentTypes";
import { getFilmData } from "../utils/search-engine";

interface ComponentProps {
}

let abortController = new AbortController()
const FilmPage: React.FC<ComponentProps> = () => {
    const { t } = useTranslation()

    const { filmId: selectedFilmId } = useParams<{ filmId: string; }>();
    const [filmData, setFilmData] = useState(null as Awaited<ReturnType<typeof getFilmData>> | null)

    useMemo(() => {
        abortController = new AbortController()
    }, [])

    const state = useAsync(async () => {
        const data = await getFilmData(+selectedFilmId, abortController.signal)
        setFilmData(data)
        try {
            const { cleanName, year } = data
            const result = await typedIpcRenderer.request("torrentsList", {
                searchQuery: `${cleanName} ${year}`
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
                                const stremioStreamingLink = await typedIpcRenderer.request("getStremioStreamingLink", { magnet: contextmenuTorrent!.magnet })
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
            <List>{
                state.value.results.length ?
                    _.sortBy(state.value.results, o => {
                        return settingsStore.settings.ui.trackerSorting === "bySize" ? o.sizeInBytes : o.seeders;
                    }).reverse().map(item => {
                        const { title, magnet, torrentID, seeders, displaySize, pageURL, torrentURL } = item
                        const playTorrent = async () => {
                            typedIpcRenderer.send("playTorrent", {
                                // player: await settingsStore.get("player", "defaultPlayer"),
                                magnet,
                                data: {
                                    playbackName: title,
                                },
                            });
                        };
                        const contextMenu = (event: React.MouseEvent<HTMLElement>) => {
                            setContextmenuTorrent(item);
                            contextmenuState.open(event);
                        };
                        return <ListItem key={torrentID} divider button onClick={playTorrent} onContextMenu={contextMenu}>
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
            }</List>
        </Grid>;
    return null;
};

export default FilmPage;
