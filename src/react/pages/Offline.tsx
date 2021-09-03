import React from "react";

import { Typography } from "@mui/material";
import { OfflineBolt } from "@mui/icons-material";

import CenterContent from "../components/CenterContent";

interface ComponentProps {
}

// feels stupid

const size = 150;

let Offline: React.FC<ComponentProps> = () => {
    return <CenterContent>
        <Typography variant="h1" className="text-red-500">No connection</Typography>
        <div className="relative" style={{ width: size, height: size }}>
            <OfflineBolt className="absolute text-red-500" sx={{ width: size, height: size }} />
            <OfflineBolt className="absolute text-red-500 animate-ping" sx={{ width: size, height: size, animationDuration: "3s" }} />
        </div>
    </CenterContent>;
};

export default Offline;
