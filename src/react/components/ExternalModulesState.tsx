import React from "react";

import { Typography } from "@material-ui/core";

interface ComponentProps {
}

let ExternalModulesState: React.FC<ComponentProps> = () => {
    const { aceStream, defaultExternalPlayer } = {} as any;

    const colorMaps = {
        connected: "lime",
        disconnected: "red"
    };

    const aceStreamStatusColor =
        aceStream.status === "disconnected" ? colorMaps.disconnected :
            aceStream.status === "connected" ? colorMaps.connected : "yellow";

    return <div style={{ transition: "color 0.2s" }}>
        <Typography variant="h5">
            <span>Ace Stream</span> – <span style={{ color: aceStreamStatusColor }}>{aceStream.status}</span>
            {aceStream.status === "connected" && <span>v{aceStream.version}</span>}
        </Typography>
        <Typography variant="h5">
            <span>External Player</span> – {
                defaultExternalPlayer.connected ?
                    <span style={{ color: colorMaps.connected }}>{defaultExternalPlayer.name} (v{defaultExternalPlayer.version})</span> :
                    <span style={{ color: colorMaps.disconnected }}>Not Found</span>
            }
        </Typography>
    </div>;
};

export default ExternalModulesState;
