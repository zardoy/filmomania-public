import React from "react";

import { Grid } from "@material-ui/core";

interface ComponentProps {
}

// todo-moderate component
let CenterContent: React.FC<ComponentProps> = () =>
    <Grid container direction="column" justify="center" alignItems="center" style={{ height: "100vh" }}></Grid>;

export default CenterContent;
