import React from "react";

import { Grid } from "@material-ui/core";

interface ComponentProps {
    GridProps?: React.ComponentProps<typeof Grid>;
}

// todo-moderate component
let CenterContent: React.FC<ComponentProps> = ({ children, GridProps }) =>
    <Grid container direction="column" justify="center" alignItems="center" style={{ height: "100vh" }} {...GridProps}>
        {children}
    </Grid>;

export default CenterContent;
