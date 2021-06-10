import React, { useEffect, useRef, useState } from "react";

import { bindPopover, usePopupState } from "material-ui-popup-state/hooks";
import { useHistory, useRouteMatch } from "react-router";
import { useAsync } from "react-use";

import {
    Chip,
    CircularProgress,
    ClickAwayListener,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    makeStyles,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Typography
} from "@material-ui/core";
import { GetApp as DownloadIcon, PlayArrow as PlayArrowIcon, Star as StarIcon } from "@material-ui/icons";

import { currentSearchFilmsVar } from "../apolloLocalState";
import CenterContent from "../components/CenterContent";
import { FilmsSearchEngineResponse, SEARCH_QUERY_MIN_LENGTH, searchByQuery } from "../utils/search-engine";

const useStyles = makeStyles(theme => ({
    poster: {
        width: theme.spacing(7),
        height: theme.spacing(7),
    }
}));
type State = {
    state: "loading";
} | {
    state: "errored";
    error: string;
} | {
    state: "done";
    result: FilmsSearchEngineResponse;
};

const useFilmItemStyles = makeStyles(() => ({
    posterImage: {
        width: "100%"
    },
    descriptionTitleBlock: {
        height: "100%",
    },
    title: {
        width: "100%"
    },
    ratingChip: ({ ratingColor }: { ratingColor: string; }) => ({
        backgroundColor: ratingColor,
        color: "white",
        fontSize: 23,
        height: 40
    })
}));

const getRatingColor = (rating: number) =>
    rating === 0 ? "#6c757d" :// gray
        rating < 5 ? "#d32f2f" : // red
            rating < 7 ? "#ff9800" : // yellow
                "#4caf50"; // green

interface FilmItemProps {
    posterUrl?: string;
    title: string;
    description?: string;
    rating?: number;
    onClick?: React.ComponentProps<typeof ListItem>["onClick"];
}

const FilmItem: React.FC<FilmItemProps> = ({ title, description, posterUrl, rating, onClick }) => {
    const classes = useFilmItemStyles({
        ratingColor: rating ? getRatingColor(rating) : ""
    });

    return <ListItem divider button onClick={onClick}>
        <Grid container wrap="nowrap" spacing={2}>
            {
                posterUrl && <Grid item xs={2}>
                    <img
                        className={classes.posterImage}
                        alt="poster"
                        src={posterUrl}
                        draggable="false"
                    />
                </Grid>
            }
            <Grid item xs={9} container justify="space-between" wrap="nowrap">
                <Grid item container direction="column" justify="center" className={classes.descriptionTitleBlock}>
                    <Typography variant="h3" noWrap className={classes.title}>{title}</Typography>
                    {
                        description && <Typography color="textSecondary">{description}</Typography>
                    }
                </Grid>
                <Grid item>
                    {
                        rating && <Chip
                            classes={{
                                root: classes.ratingChip
                            }}
                            // todo fix star
                            icon={<StarIcon />}
                            label={rating}
                        />}
                </Grid>
            </Grid>
        </Grid>
    </ListItem>;
};

interface ComponentProps {
}

let Search: React.FC<ComponentProps> = () => {
    const classes = useStyles();
    const history = useHistory();

    const moreOptionsPopoverState = usePopupState({ variant: "popover", popupId: "filmMoreOptions" });

    const { params: routeParams } = useRouteMatch<{ query: string; }>();

    const abortController = useRef(new AbortController());

    const state = useAsync(async () => {
        abortController.current = new AbortController();
        const { query } = routeParams;
        if (query.length < SEARCH_QUERY_MIN_LENGTH) return null;
        try {
            const result = await searchByQuery(query, {
                abortSignal: abortController.current.signal
            });
            currentSearchFilmsVar(result.films);
            return result;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, [routeParams]);

    useEffect(() => () => abortController.current.abort(), [routeParams]);

    const [dropdownFilmId, setDropdownFilmId] = useState(null as number | null);

    // const dropdownFilmAction = useCallback((action: "play" | "download") => {

    // }, []);

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
                                    history.push(`/film/${filmId}`);
                                };
                                const displayYear = restInfo.type === "film" ? restInfo.year :
                                    restInfo.yearTo === "nowadays" ? `From ${restInfo.yearFrom}` : `${restInfo.yearFrom} — ${restInfo.yearTo}`;
                                return <FilmItem
                                    key={filmId}
                                    title={nameRu || nameEn}
                                    description={`${displayYear} ${description}`}
                                    posterUrl={posterUrlPreview}
                                    rating={rating}
                                    onClick={openFilmPage}
                                />;
                                // return <ListItem button key={filmId} onClick={openFilmPage}>
                                //     {hasPoster && <ListItemAvatar>
                                //         <img alt="poster" src={posterUrlPreview} className={classes.poster} />
                                //     </ListItemAvatar>}
                                //     <ListItemText inset={!hasPoster} primary={nameRu || nameEn} secondary={description} />
                                //     <ListItemSecondaryAction>
                                //         <IconButton edge="end" {...bindTrigger(moreOptionsPopoverState)}>
                                //             <MoreHorizIcon />
                                //         </IconButton>
                                //     </ListItemSecondaryAction>
                                // </ListItem>;
                            }) : <CenterContent><Typography>No results for {routeParams.query}</Typography></CenterContent>
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
