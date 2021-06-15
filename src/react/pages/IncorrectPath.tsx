import React from "react";

import { Link as RouterLink, useLocation } from "react-router-dom";

import { Button, Typography } from "@material-ui/core";

import CenterContent from "../components/CenterContent";

interface ComponentProps {
}

let IncorrectPath: React.FC<ComponentProps> = () => {
    const location = useLocation();

    return <CenterContent>
        <Typography variant="h3" color="error">404</Typography>
        <Typography variant="h4" color="textSecondary">Incorrect path {location.pathname}</Typography>
        <Button component={RouterLink} to="/">GO HOME</Button>
    </CenterContent>;
};

export default IncorrectPath;
