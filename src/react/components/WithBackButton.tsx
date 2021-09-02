import React, { useCallback } from "react";

import { useHistory } from "react-router";

import { Button, Grid } from "@material-ui/core";
import { ArrowBackIos } from "@material-ui/icons";

interface ComponentProps {
}

let WithBackButton: React.FC<ComponentProps> = ({ children }) => {
    const routerHistory = useHistory();

    const clickBackHandle = useCallback(() => {
        if (routerHistory.length > 1) {
            routerHistory.goBack();
        } else {
            routerHistory.push("/");
        }
    }, []);

    return <Grid container direction="column">
        <Button startIcon={<ArrowBackIos />} onClick={clickBackHandle}>BACK</Button>
        {children}
    </Grid>;
};

export default WithBackButton;
