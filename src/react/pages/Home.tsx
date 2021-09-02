import React from "react";

import { Typography } from "@material-ui/core";

import SearchBox from "../components/SearchBox";

interface ComponentProps {
}

let HomePage: React.FC<ComponentProps> = () => {
    return <>
        <Typography sx={{ fontWeight: 900 }} variant="h1" align="center">FILMOMANIA</Typography>
        <SearchBox />
    </>;
};

export default HomePage;
