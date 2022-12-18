import React, { useCallback } from "react";

import { useHistory } from "react-router-dom";

import { Button, Grid } from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";

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
