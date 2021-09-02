import React, { useRef, useState } from "react";

import { useHistory } from "react-router-dom";
import { useDebounce } from "react-use";
import useEventListener from "use-typed-event-listener";

import { Button, TextField, useTheme } from "@material-ui/core";

import { SEARCH_QUERY_MIN_LENGTH } from "../utils/search-engine";
import FilmsSearchResult from "./FilmsSearchResult";

interface ComponentProps {
}

let SearchBox: React.FC<ComponentProps> = () => {
    const history = useHistory();
    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement>(null!);
    const [query, setQuery] = useState("");

    useEventListener(window, "keyup", ({ code, target }) => {
        // eslint-disable-next-line no-extra-parens
        if ((target as Element).tagName === "input") return;

        const inputEl = inputRef.current;

        if (code === "Slash") {
            inputEl.focus();
        }
    });

    const loadSearchResults = useDebounce(() => {
        if (query.length < SEARCH_QUERY_MIN_LENGTH) return;

        console.log("Trigger", query);
        // history.push(`/search/${searchQuery}`);
    }, 500, [query]);

    return <form
        className="mx-5"
    >
        <TextField
            inputRef={inputRef}
            sx={{
                position: "relative",
                width: "100%",
                zIndex: theme.zIndex.drawer + 2
            }}
            size="small"
            variant="outlined"
            label="Search films"
            value={query}
            onChange={e => setQuery(e.target.value)}
        />
        {
            import.meta.env.MODE !== "production" && <Button onClick={() => history.push("/search/gthdjve")}>Test router</Button>
        }
        <FilmsSearchResult />
        {/* toggle between search engine and raw search */}
        {/* TODO end button for filters */}
    </form>;
};

export default SearchBox;

