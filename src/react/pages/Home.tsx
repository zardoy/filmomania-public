import React from "react";

import { Typography } from "@mui/material";

import SearchBox from "../components/SearchBox";
import { typedIpcRenderer } from "typed-ipc";

interface ComponentProps {
}

let HomePage: React.FC<ComponentProps> = () => {
    return <>
        <Typography sx={{ fontWeight: 900 }} variant="h1" align="center">FILMOMANIA</Typography>
        <SearchBox />
    </>;
};

export default HomePage;
