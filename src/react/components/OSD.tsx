import React, { useEffect, useState } from "react";

import { Chip, makeStyles, Typography } from "@material-ui/core";

const useStyles = makeStyles({
    timeDisplay: {
        background: "rgba(0, 0, 0, 0.7)",
        color: "lightgray",
        borderRadius: 0,
        padding: "2px 3px",
    },
    root: {
        position: "fixed",
        top: 3,
        right: 3,
    }
});

interface ComponentProps {
    ChipProps?: React.ComponentProps<typeof Chip>;
}

let OSD: React.FC<ComponentProps> = ({ ChipProps = {} }) => {
    const classes = useStyles();

    const [time, setTime] = useState("");

    const [hrdEnabled, setHdrEnabled] = useState(() => window.matchMedia("(color-gamut: p3)").matches);

    useEffect(() => {
        let formatter = new Intl.DateTimeFormat(undefined, {//using system locale
            hour: "2-digit",
            minute: "2-digit"
        });
        const interval = setInterval(() => {
            setTime(
                formatter.format(new Date())
            );
        }, 1000);//is it draining battery?lul
        return () => {
            clearInterval(interval);
        };
    }, []);

    return <div className={classes.root}>
        <Typography
            className={classes.timeDisplay}
            variant="body2"
        >{time}</Typography>
    </div>;
};

export default OSD;
