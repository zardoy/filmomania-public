import React, { useEffect, useRef, useState } from "react";
import { proxy } from "valtio"

import { bindPopover, usePopupState } from "material-ui-popup-state/hooks";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useAsync } from "react-use";

import { css } from "@emotion/css";
import {
    Chip,
    CircularProgress,
    ClickAwayListener,
    Grid,
    List,
    ListItemButton,
    ListItemIcon,
    Menu,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Typography
} from "@mui/material";
import { GetApp as DownloadIcon, OpenInNew, PlayArrow as PlayArrowIcon, Search as SearchIcon, Star as StarIcon } from "@mui/icons-material";

import CenterContent from "../components/CenterContent";
import { SEARCH_QUERY_MIN_LENGTH, searchByQuery, FilmsSearchEngineResponse, ParsedFilmInfo } from "../utils/search-engine";
import { useTranslation } from "react-i18next";
import ContextMenu from "../components/ContextMenu";
import { shell } from "electron";
import ButtonsList from "../components/ButtonsList";
import { getFilmsHistory } from "../playHistory";

const getRatingColor = (rating: number) =>
    rating === 0 ? "#6c757d" :// gray
        rating < 5 ? "#d32f2f" : // red
            rating < 7 ? "#ff9800" : // yellow
                "#4caf50"; // green

interface FilmItemProps extends React.ComponentProps<typeof ListItemButton> {
    data: Pick<ParsedFilmInfo, "posterUrl" | "description" | "rating" | "filmLengthRaw">
    title: string;
    year?: string;
    watchProgress?: number
}

const FilmItem: React.FC<FilmItemProps> = ({ title, year, data, watchProgress, ...rootProps }) => {
    const { description, filmLengthRaw, rating, posterUrl, } = data
    return <ListItemButton divider {...rootProps} classes={{
        root: css`
            position: relative;
        `
    }}>
        <Grid container wrap="nowrap" spacing={2}>
            {
                posterUrl && <Grid item xs={2}>
                    <div className='relative'>
                        <img
                            className='w-full'
                            alt="poster"
                            src={posterUrl}
                            draggable="false"
                        />
                        <div className='absolute right-0 -my-5 bg-black bg-opacity-60 px-1'>{filmLengthRaw}</div>
                    </div>
                </Grid>
            }
            <Grid item xs={9} container justifyContent="space-between" wrap="nowrap">
                <Grid item container direction="column" justifyContent="center" sx={{ height: "100%" }}>
                    <Typography variant="h3" noWrap sx={{ width: "100%" }}>{title}</Typography>
                    {
                        description && <Typography color="textSecondary"><b>{year}</b> {description}</Typography>
                    }
                </Grid>
                <Grid item>
                    {
                        rating && <Chip
                            classes={{
                                root: css`
                                    background-color: ${getRatingColor(rating)};
                                    color: white;
                                    font-size: 23px;
                                    height: 40px;
                                `
                            }}
                            // todo fix star
                            icon={<StarIcon />}
                            label={rating}
                        />}
                </Grid>
            </Grid>
        </Grid>
        {watchProgress &&
            <div className="absolute bottom-0 w-full bg-gradient-to-r from-transparent to-green-400"
                style={{ width: 300, height: 6, left: `calc(${watchProgress * 100}% - 300px)` }} />}
    </ListItemButton>;
};

export const filmsSearchResult = proxy({ value: undefined as undefined | FilmsSearchEngineResponse["films"] })

let previousScrollY = null as null | number

let SearchResults: React.FC = () => {
    const [filmsHistory] = useState(getFilmsHistory())
    const { t } = useTranslation()
    const routerHistory = useHistory();

    const contextmenuPopoverState = usePopupState({ variant: "popover", popupId: "filmMoreOptions" });

    const { search } = useLocation();
    const query = decodeURIComponent(search.slice("?q=".length))

    const abortController = useRef(new AbortController());

    const state = useAsync(async () => {
        abortController.current = new AbortController();
        if (query.length < SEARCH_QUERY_MIN_LENGTH) return null;
        try {
            const result = await searchByQuery(query, {
                abortSignal: abortController.current.signal
            });
            filmsSearchResult.value = result.films
            return result;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, [query]);

    useEffect(() => () => abortController.current.abort(), [query]);

    const [dropdownFilmId, setDropdownFilmId] = useState(null as number | null);

    if (state.value === null) return null

    return <>
        <Menu
            {...bindPopover(contextmenuPopoverState)}
        >
            <ContextMenu
                items={[
                    {
                        label: "Open film page",
                        action() {
                            void shell.openExternal(`https://www.kinopoisk.ru/film/${dropdownFilmId!}/`)
                        },
                        icon: <OpenInNew />

                    },
                    {
                        label: "Search with original name",
                        action() {
                            routerHistory.push(`/film/${dropdownFilmId}?altSearch=1`);
                            window.scrollTo(0, 0)
                        },
                        icon: <SearchIcon />

                    }
                ]}
                onClose={contextmenuPopoverState.close}
            />
        </Menu>
        {
            state.value ?
                // TODO LIST PROPS
                <ButtonsList>
                    {
                        state.value.films.length ?
                            state.value.films.map(({ filmId, nameRu, nameEn, posterUrlPreview, ...restInfo }) => {
                                const openFilmPage = () => {
                                    routerHistory.push(`/film/${filmId}`);
                                    window.scrollTo(0, 0)
                                };
                                const displayYear = restInfo.type === "film" ? restInfo.year :
                                    restInfo.yearTo === "nowadays" ? `From ${restInfo.yearFrom}` : `${restInfo.yearFrom} — ${restInfo.yearTo}`;
                                let watchProgress: number | undefined
                                if (filmsHistory[filmId]) {
                                    const execResult = /(\d{1,2})\s?:\s?(\d{1,2})/.exec((restInfo.filmLength ?? "").trim())
                                    if (execResult) {
                                        const [, hours, minutes] = execResult
                                        watchProgress = filmsHistory[filmId]!.time / 60 / (+hours! * 60 + +minutes!)
                                    }
                                }

                                return <FilmItem
                                    key={filmId}
                                    title={nameRu || nameEn}
                                    data={{
                                        posterUrl: posterUrlPreview,
                                        ...restInfo
                                    }}
                                    year={displayYear.toString()}
                                    onClick={openFilmPage}
                                    onContextMenu={e => {
                                        setDropdownFilmId(filmId)
                                        contextmenuPopoverState.open(e)
                                    }}
                                    watchProgress={watchProgress}
                                />;
                            }) : <CenterContent><Typography>{t("No results for")} {query}</Typography></CenterContent>
                    }
                </ButtonsList> :
                <CenterContent>
                    {
                        state.loading ? <CircularProgress /> :
                            <Typography variant="body1">Error {state.error?.message}</Typography>
                    }
                </CenterContent>
        }
    </>;
};

export default SearchResults;
