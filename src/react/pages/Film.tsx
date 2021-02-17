import React, { useEffect, useState } from "react";

import { useParams } from "react-router";

import { useReactiveVar } from "@apollo/client";
import { CircularProgress, Grid, Typography } from "@material-ui/core";

import { currentSearchFilmsVar } from "../apolloLocalState";
import CenterContent from "../components/CenterContent";
import { TorrentItem } from "../electron-shared/TorrentItem";

type State = {
    state: "loading";
} | {
    state: "errored";
    error: string;
} | {
    state: "done";
    result: TorrentItem[];
};

interface ComponentProps {
}

const FilmPage: React.FC<ComponentProps> = () => {
    const { filmId: selectedFilmId } = useParams<{ filmId: string; }>();

    const films = useReactiveVar(currentSearchFilmsVar);

    const [state, setState] = useState({ state: "loading" } as State);

    useEffect(() => {
        const abortController = new AbortController();
        const filmInfo = films.find(({ filmId }) => filmId === +selectedFilmId);
        if (!filmInfo) {
            // todo high
            setState({
                state: "errored",
                error: "Perform search again."
            });
        }
        setState({
            state: "loading",
        });
        // load results
    }, [films]);

    return state.state !== "done" ?
        <CenterContent>
            {
                state.state === "loading" ? <CircularProgress /> : state.error
            }
        </CenterContent> :
        <Grid direction="column">
            <Typography variant="h4">Результатов с rutor.info: 120</Typography>
            {
                // parse results to list
            }
        </Grid>;
};

export default FilmPage;
