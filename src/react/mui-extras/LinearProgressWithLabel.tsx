import React from "react";

import { Box, LinearProgress, LinearProgressProps, Typography } from "@mui/material";

type LinearProgressWithLabelProps = LinearProgressProps & { label: string; };

// todo dont use with min-width its hard coded

const LinearProgressWithLabel: React.FC<LinearProgressWithLabelProps> = props =>
    <Box display="flex" alignItems="center" width="80%">
        <Box width="100%" minWidth={150} mr={1}>
            <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box minWidth={65}>
            <Typography variant="body2" color="textSecondary">{props.label}</Typography>
        </Box>
    </Box>;

export default LinearProgressWithLabel;
