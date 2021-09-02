import React, { useEffect, useState } from "react";

import isOnline from "is-online";
import { useHistory } from "react-router-dom";
import { useNetworkState } from "react-use";
import { typedIpcRenderer } from "typed-ipc";

import { useProxyState } from "../localState";
import Notification from "./Notification";

interface ComponentProps {
}

// notistack

let ElectronEvents: React.FC<ComponentProps> = () => {
    const routerHistory = useHistory();

    const proxyState = useProxyState();

    const navigatorNetworkStatus = useNetworkState();

    const isOffline = useState(false);

    useEffect(() => {
        isOnline().then(isOnline => isOffline[1](!isOnline));
    }, [navigatorNetworkStatus.online]);


    useEffect(() => {
        typedIpcRenderer.addEventListener("openRoute", (_event, { url }) => {
            routerHistory.push(url);
        });

        typedIpcRenderer.addEventListener("proxySetup", (_event, { success, errorMessage = "" }) => {
            if (success) {
                useProxyState.setState({
                    state: "success"
                });
            } else {
                useProxyState.setState({
                    state: "errored",
                    errorMessage
                });
            }
        });

        return () => {
            typedIpcRenderer.removeAllListeners("openRoute");
            typedIpcRenderer.removeAllListeners("proxySetup");
        };
    }, []);

    return <>
        <Notification
            open={proxyState.state === "pending"}
            message="Warming up your proxy companions..."
            severity="info"
            icon={null}
            progress={true}
        />
        <Notification
            open={isOffline[0]}
            message="No internet connection"
            severity="error"
        />
    </>;
};

export default ElectronEvents;
