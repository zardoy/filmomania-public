import React, { useEffect, useState } from "react";

import { shell } from "electron";
import _ from "lodash";
import { bindPopover, usePopupState } from "material-ui-popup-state/hooks";
import { useHistory, useParams } from "react-router";
import { typedIpcRenderer } from "typed-ipc";

import { useReactiveVar } from "@apollo/client";
import {
    Button,
    CircularProgress,
    ClickAwayListener,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Typography
} from "@material-ui/core";
import { Launch as LaunchIcon } from "@material-ui/icons";
import OpenInBrowserIcon from "@material-ui/icons/OpenInBrowser";
import { Alert } from "@material-ui/lab";

import { currentSearchFilmsVar } from "../apolloLocalState";
import CenterContent from "../components/CenterContent";
import { settingsStore } from "../electron-shared/settings";
import { TorrentEngineParseResult } from "../electron-shared/TorrentTypes";

type State = {
    state: "loading";
} | {
    state: "errored";
    error: string;
} | {
    state: "done";
    result: TorrentEngineParseResult;
};

interface ComponentProps {
}

const FilmPage: React.FC<ComponentProps> = () => {
    const { filmId: selectedFilmId } = useParams<{ filmId: string; }>();

    const films = useReactiveVar(currentSearchFilmsVar);

    const [state, setState] = useState<State>({ state: "loading" });

    const routerHistory = useHistory();

    const loadList = async () => {
        const filmInfo = films.find(({ filmId }) => filmId === +selectedFilmId);
        if (!filmInfo) {
            // todo high
            setState({
                state: "errored",
                error: "Perform search again."
            });
            routerHistory.replace("/");
            return;
        }
        setState({
            state: "loading",
        });
        const { cleanName, ...rest } = filmInfo;
        const yearForSearch = rest.type === "film" ? rest.year : rest.yearFrom;
        try {
            const result = await typedIpcRenderer.request("torrentsList", {
                searchQuery: `${cleanName} ${yearForSearch}`
            });
            if ("error" in result) {
                throw new Error(result.error);
            }
            setState({
                state: "done",
                result: result.parseResult
            });
        } catch (err) {
            setState({
                state: "errored",
                error: `${err.message}\nTry to CTRL+R to find another proxy`
            });
        }
    };

    useEffect(() => {
        // abortController
        void loadList();
    }, [films]);

    const moreOptionsPopoverState = usePopupState({ variant: "popover", popupId: "torrentIdMoreOptions" });

    //fsdkf;'s'
    const [dropdownTorrentIndex, setDropdownTorrentIndex] = useState<[string, string]>(["", ""]);

    return state.state !== "done" ?
        <CenterContent>
            {
                state.state === "loading" ? <CircularProgress /> :
                    <>
                        <Typography color="error">{state.error}</Typography>
                        <Button onClick={loadList}>Reload</Button>
                    </>
            }
        </CenterContent> :
        <Grid container direction="column">
            <Popper
                {...bindPopover(moreOptionsPopoverState)}
            >
                <Paper>
                    <ClickAwayListener onClickAway={moreOptionsPopoverState.close}>
                        <MenuList>
                            <MenuItem onClick={() => {
                                void shell.openExternal(dropdownTorrentIndex[0]);
                            }}>
                                <ListItemIcon>
                                    <OpenInBrowserIcon />
                                </ListItemIcon>
                                <Typography variant="inherit">Open torrent page</Typography>
                            </MenuItem>
                            <MenuItem onClick={() => {
                                typedIpcRenderer.send("downloadAndOpenTorrentFile", {
                                    torrentFileUrl: dropdownTorrentIndex[1]
                                });
                            }}>
                                <ListItemIcon>
                                    <LaunchIcon />
                                </ListItemIcon>
                                <Typography variant="inherit">Open .torrent file</Typography>
                            </MenuItem>
                        </MenuList>
                    </ClickAwayListener>
                </Paper>
            </Popper>
            <Typography variant="h4">Results from rutor.info: {state.result.totalResults}</Typography>
            {
                state.result.hiddenResults > 0 &&
                <Alert severity="warning">We have hidden results: {state.result.hiddenResults}</Alert>
            }
            <List>{
                state.result.results.length ?
                    _.sortBy(state.result.results, o => o.sizeInBytes).reverse().map(({ title, magnet, torrentID, seeders, displaySize, pageURL, torrentURL }) => {
                        const playTorrent = () => {
                            typedIpcRenderer.send("playInPlayer", {
                                player: settingsStore.get("generalDefaultPlayer") as any,
                                magnet
                            });
                        };
                        const contextM = (event: React.MouseEvent<HTMLElement>) => {
                            setDropdownTorrentIndex([pageURL, torrentURL]);
                            moreOptionsPopoverState.open(event);
                        };
                        return <ListItem key={torrentID} divider button onClick={playTorrent} onContextMenu={contextM}>
                            <Grid container justify="space-between" wrap="nowrap">
                                <Typography>{title}</Typography>
                                <div style={{ float: "right", display: "flex" }}>
                                    <Typography style={{ color: seeders === 0 ? "red" : seeders < 8 ? "yellow" : "limegreen" }}>{seeders}</Typography>
                                    <Typography style={{ marginLeft: 15 }}>{displaySize}</Typography>
                                </div>
                            </Grid>
                        </ListItem>;
                    })
                    : <Typography>No results on rutor.info!</Typography>
            }</List>
        </Grid>;
};

export default FilmPage;
