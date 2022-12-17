import React, { useRef, useState } from "react";

import { useHistory } from "react-router-dom";
import { useDebounce } from "react-use";
import useEventListener from "use-typed-event-listener";

import { TextField, useTheme } from "@mui/material";

import Search from "../pages/Search";

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

    useDebounce(() => {
        history.push({search: `?q=${query}`});
    }, 500, [query]);

    return <>
        <form
            className="mx-5"
            onSubmit={() => history.push({search: `?q=${query}`})}
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
        </form>
        <Search />
    </>;
};

export default SearchBox;
