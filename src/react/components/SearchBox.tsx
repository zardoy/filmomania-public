import React, { useCallback, useMemo, useState } from "react";

import { useFormik } from "formik";
import _ from "lodash";
import { useHistory } from "react-router-dom";

import { Backdrop, Button, makeStyles, TextField } from "@material-ui/core";

import { SEARCH_QUERY_MIN_LENGTH } from "../utils/search-engine";

const useStyles = makeStyles(theme => ({
    appTitle: {
        fontWeight: 900
    },
    search: {
        margin: "0 15px"
    },
    searchField: {
        position: "relative",
        width: "100%",
        zIndex: theme.zIndex.drawer + 2
    },
    // todo show backdrop only on home page
    searchBackdrop: {
        zIndex: theme.zIndex.drawer + 1
    }
}));

interface ComponentProps {
}

let SearchBox: React.FC<ComponentProps> = () => {
    const classes = useStyles();

    const history = useHistory();

    const triggerLoadResults = useMemo(() =>
        _.debounce(
            async (searchQuery: string) => {
                if (searchQuery.length < SEARCH_QUERY_MIN_LENGTH) return;
                history.push(`/search/${searchQuery}`);
                // todo review debounce
            }, 200), [/* history */]);

    const { values, setFieldValue, handleSubmit } = useFormik({
        initialValues: {
            search: ""
        },
        onSubmit({ search }) {
            void triggerLoadResults(search);
        }
    });

    const fieldChangeHandler = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        // todo-moderate why promise?
        void setFieldValue("search", query);
        // todo rework debounce
        // TODO-high rename to debounced or move on
        // await triggerLoadResults(query);
    }, [setFieldValue]);

    const [inputFocused, setInputFocused] = useState(false);

    // todo why is it closing sometimes and add no options
    return <form className={classes.search} onSubmit={handleSubmit}>
        <Backdrop className={classes.searchBackdrop} open={inputFocused/*  && values.search.length < SEARCH_QUERY_MIN_LENGTH */} />
        {/* todo highlight suggestions */}
        {/* <Autocomplete
            handleHomeEndKeys
            freeSolo
            filterOptions={options => options}
            options={!state.loading && state.suggestions ? state.suggestions : []}
            loading={state.loading}
            renderOption={film =>
                <>
                    {film.posterUrlPreview &&
                        <ListItemAvatar>
                            <Avatar alt="" src={film.posterUrlPreview} variant="square" />
                        </ListItemAvatar>
                    }
                    {film.nameRu || film.nameEn}
                </>
            }
            renderInput={params => }
        /> */}
        <TextField
            className={classes.searchField}
            size="small"
            variant="outlined"
            label="Search film..."
            value={values.search}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onChange={fieldChangeHandler}
        />
        {
            import.meta.env.MODE !== "production" && <Button onClick={() => history.push("/search/gthdjve")}>Test router</Button>
        }
        {/* toggle between search engine and raw search */}
        {/* TODO end button for filters */}
    </form>;
};

export default SearchBox;

