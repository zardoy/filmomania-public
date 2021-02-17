import React from "react";

import { useHistory } from "react-router";

import { Button, Grid } from "@material-ui/core";
import { ArrowBackIos } from "@material-ui/icons";

interface ComponentProps {
}

let WithBackButton: React.FC<ComponentProps> = ({ children }) => {
    const routerHistory = useHistory();

    return <Grid container direction="column">
        <Button startIcon={<ArrowBackIos />} onClick={routerHistory.goBack}>BACK</Button>
        {children}
    </Grid>;
};

export default WithBackButton;
