import React from "react";

import { Grid, makeStyles, Typography } from "@material-ui/core";

import SearchBox from "../components/SearchBox";

const useStyles = makeStyles({
    appTitle: {
        fontWeight: 900
    }
});

interface ComponentProps {
}

let HomePage: React.FC<ComponentProps> = () => {
    const classes = useStyles();
    return <>
        <Grid container direction="column" justify="space-between" style={{ height: "100vh" }}>
            <Typography className={classes.appTitle} variant="h1" align="center">FILMOMANIA</Typography>
            <SearchBox />
            <Grid item />
            <Grid item />
            <Grid item />
        </Grid>
    </>;
};

export default HomePage;
