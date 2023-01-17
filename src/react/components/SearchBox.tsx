import React, { useEffect, useRef, useState } from "react";

import { useHistory, useLocation } from "react-router-dom";
import { useDebounce } from "react-use";
import useEventListener from "use-typed-event-listener";
import { useTranslation } from "react-i18next"

import { TextField, useTheme } from "@mui/material";

import SearchResults from "../pages/SearchResults";
import { focusNextElemOnPage, useKeyPress } from "../utils/react";

interface ComponentProps {
}

let SearchBox: React.FC<ComponentProps> = () => {
    const { t } = useTranslation()

    const { search } = useLocation()
    const history = useHistory();
    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement>(null!);
    const [query, setQuery] = useState("");

    useEventListener(window, "keyup", ({ code, target }) => {
        // eslint-disable-next-line no-extra-parens
        const t = (target as HTMLInputElement);
        if (t.tagName.toLowerCase() === "input") {
            if (code === "ArrowDown") {
                focusNextElemOnPage()
            }
            if (code === "Escape") {
                setQuery("")
                doSearch()
            }
            return;
        }

        const inputEl = inputRef.current;

        if (code === "Slash") {
            inputEl.focus();
        }
    });

    const doSearch = () => {
        history.push({ search: `?q=${query}` });
    }

    useDebounce(() => {
        doSearch()
    }, 500, [query]);

    useEffect(() => {
        setQuery(decodeURIComponent(search.slice("?q=".length)))
    }, [search])

    return <>
        <form
            className="mx-5"
            onSubmit={e => {
                doSearch()
                e.preventDefault()
            }}
        >
            <TextField
                inputRef={inputRef}
                sx={{
                    position: "relative",
                    width: "100%",
                    zIndex: theme.zIndex.drawer + 2
                }}
                autoFocus
                size="small"
                variant="outlined"
                label={t("Search films")}
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
        </form>
        <SearchResults />
    </>;
};

export default SearchBox;
