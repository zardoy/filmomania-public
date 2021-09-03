import React from "react";

import { Alert, CircularProgress, Snackbar } from "@mui/material";

interface ComponentProps {
    open: boolean;
    severity: React.ComponentProps<typeof Alert>["severity"];
    message: string;
    icon?: null | JSX.Element;
    progress?: boolean | number;
}

let Notification: React.FC<ComponentProps> = ({ open, severity, icon, progress, message }) => {
    const showProgress = typeof progress === "number" || progress === true;

    return <Snackbar
        open={open}
        anchorOrigin={{
            vertical: "bottom",
            horizontal: "right"
        }}
    >
        <Alert severity={severity} icon={icon === null ? <></> : icon} classes={{
            message: "flex items-center text-base"
        }}>
            {showProgress && import.meta.env.PROD && <CircularProgress
                variant={typeof progress === "number" ? "determinate" : "indeterminate"}
                value={typeof progress === "number" ? progress : undefined}
                size={25}
                className="mr-3"
            />} {message}
        </Alert>
    </Snackbar>;
};

export default Notification;
