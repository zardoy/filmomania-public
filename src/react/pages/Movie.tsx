import React, { useEffect, useState } from "react";

import _ from "lodash";
import { useParams } from "react-router";
import { typedIpcRenderer } from "typed-ipc";

import { useReactiveVar } from "@apollo/client";
import { Button, CircularProgress, Grid, List, ListItem, ListItemSecondaryAction, Typography } from "@material-ui/core";
import { Alert } from "@material-ui/lab";

import { currentSearchFilmsVar } from "../apolloLocalState";
import CenterContent from "../components/CenterContent";
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

    const [state, setState] = useState({ state: "loading" } as State);

    const loadList = async () => {
        const filmInfo = films.find(({ filmId }) => filmId === +selectedFilmId);
        if (!filmInfo) {
            // todo high
            setState({
                state: "errored",
                error: "Perform search again."
            });
            return;
        }
        setState({
            state: "loading",
        });
        const { cleanName, ...rest } = filmInfo;
        const yearForSearch = rest.type === "film" ? rest.year : rest.yearFrom;
        const result = await typedIpcRenderer.request("torrentsList", {
            searchQuery: `${cleanName} ${yearForSearch}`
        });
        if ("error" in result) {
            setState({
                state: "errored",
                error: result.error
            });
        } else {
            setState({
                state: "done",
                result: result.parseResult
            });
        }
    };

    useEffect(() => {
        // abortController
        void loadList();
    }, [films]);

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
            <Typography variant="h4">Result from rutor.info: {state.result.totalResults}</Typography>
            {
                state.result.hiddenResults > 0 &&
                <Alert severity="warning">We have hidden results: {state.result.hiddenResults}</Alert>
            }
            <List>{
                _.sortBy(state.result.results, o => o.sizeInBytes).reverse().map(({ title, magnet, torrentID, seeders, displaySize }) => {
                    const playWithSoda = () => {
                        typedIpcRenderer.send("playInPlayer", {
                            player: "sodaPlayer",
                            magnet
                        });
                    };
                    return <ListItem key={torrentID} divider button onClick={playWithSoda}>
                        {title}
                        <ListItemSecondaryAction>
                            <Typography color="textSecondary">{seeders}</Typography>
                            <Typography>{displaySize}</Typography>
                        </ListItemSecondaryAction>
                    </ListItem>;
                })
            }</List>
        </Grid>;
};

export default FilmPage;
