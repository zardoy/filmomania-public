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
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Typography
} from "@mui/material";
import { GetApp as DownloadIcon, PlayArrow as PlayArrowIcon, Star as StarIcon } from "@mui/icons-material";

import CenterContent from "../components/CenterContent";
import { SEARCH_QUERY_MIN_LENGTH, searchByQuery, FilmsSearchEngineResponse } from "../utils/search-engine";

const getRatingColor = (rating: number) =>
    rating === 0 ? "#6c757d" :// gray
        rating < 5 ? "#d32f2f" : // red
            rating < 7 ? "#ff9800" : // yellow
                "#4caf50"; // green

interface FilmItemProps {
    posterUrl?: string;
    title: string;
    description?: string;
    year?: string;
    rating?: number;
    onClick?: React.ComponentProps<typeof ListItemButton>["onClick"];
}

const FilmItem: React.FC<FilmItemProps> = ({ title, description, posterUrl, year, rating, onClick }) => {
    return <ListItemButton divider onClick={onClick}>
        <Grid container wrap="nowrap" spacing={2}>
            {
                posterUrl && <Grid item xs={2}>
                    <img
                        className={css`
                            width: 100%;
                        `}
                        alt="poster"
                        src={posterUrl}
                        draggable="false"
                    />
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
    </ListItemButton>;
};

export const filmsSearchResult = proxy({value: undefined as undefined | FilmsSearchEngineResponse["films"]})

let Search: React.FC = () => {
    const routerHistory = useHistory();

    const moreOptionsPopoverState = usePopupState({ variant: "popover", popupId: "filmMoreOptions" });

    const {search} = useLocation();
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

    // const dropdownFilmAction = useCallback((action: "play" | "download") => {

    // }, []);

    if (state.value === null) return null

    return <>
        <Popper
            {...bindPopover(moreOptionsPopoverState)}
        >
            <Paper>
                <ClickAwayListener onClickAway={moreOptionsPopoverState.close}>
                    <MenuList>
                        <MenuItem>
                            <ListItemIcon>
                                <PlayArrowIcon />
                            </ListItemIcon>
                            <Typography variant="inherit">Play Now</Typography>
                        </MenuItem>
                        <MenuItem>
                            <ListItemIcon>
                                <DownloadIcon />
                            </ListItemIcon>
                            <Typography variant="inherit">Download</Typography>
                        </MenuItem>
                    </MenuList>
                </ClickAwayListener>
            </Paper>
        </Popper>
        {
            state.value ?
                // TODO LIST PROPS
                <List>
                    {
                        state.value.films.length ?
                            state.value.films.map(({ filmId, nameRu, nameEn, posterUrlPreview, description, rating, ...restInfo }) => {
                                const openFilmPage = () => {
                                    routerHistory.push(`/film/${filmId}`);
                                };
                                const displayYear = restInfo.type === "film" ? restInfo.year :
                                    restInfo.yearTo === "nowadays" ? `From ${restInfo.yearFrom}` : `${restInfo.yearFrom} — ${restInfo.yearTo}`;
                                return <FilmItem
                                    key={filmId}
                                    title={nameRu || nameEn}
                                    description={description}
                                    year={displayYear.toString()}
                                    posterUrl={posterUrlPreview}
                                    rating={rating}
                                    onClick={openFilmPage}
                                />;
                                // return <ListItem button key={filmId} onClick={openFilmPage}>
                                //     {hasPoster && <ListItemAvatar>
                                //         <img alt="poster" src={posterUrlPreview} sx={{ width: theme.spacing(7),
                                // height: theme.spacing(7), }} />
                                //     </ListItemAvatar>}
                                //     <ListItemText inset={!hasPoster} primary={nameRu || nameEn} secondary={description} />
                                //     <ListItemSecondaryAction>
                                //         <IconButton edge="end" {...bindTrigger(moreOptionsPopoverState)}>
                                //             <MoreHorizIcon />
                                //         </IconButton>
                                //     </ListItemSecondaryAction>
                                // </ListItem>;
                            }) : <CenterContent><Typography>No results for {query}</Typography></CenterContent>
                    }
                </List> :
                <CenterContent>
                    {
                        state.loading ? <CircularProgress /> :
                            <Typography variant="body1">Error {state.error?.message}</Typography>
                    }
                </CenterContent>
        }
    </>;
};

export default Search;
