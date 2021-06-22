import React, { useEffect, useState } from "react";

import { Chip, Typography, useMediaQuery } from "@material-ui/core";

interface ComponentProps {
    ChipProps?: React.ComponentProps<typeof Chip>;
}

let Overlay: React.FC<ComponentProps> = ({ ChipProps = {} }) => {
    const [time, setTime] = useState("");

    const hdrEnabled = useMediaQuery("(color-gamut: p3)");

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

    return <div className="fixed top-1 right-1">
        <Typography
            variant="body2"
            sx={{
                background: "rgba(0, 0, 0, 0.7)",
                color: "lightgray",
                borderRadius: 0,
                padding: "2px 3px",
            }}
        >{time}</Typography>
    </div>;
};

export default Overlay;
