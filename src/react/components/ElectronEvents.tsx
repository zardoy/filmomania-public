import React, { useEffect, useState } from "react";

import isOnline from "is-online";
import { useHistory } from "react-router-dom";
import { useNetworkState } from "react-use";
import { typedIpcRenderer } from "typed-ipc";

import { useProxyState } from "../localState";
import Notification from "./Notification";
import { Button } from "@mui/material";
import { settingsStore } from "../electron-shared/settings";

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

    const setupProxy = () => {
        useProxyState.setState({
            state: "pending"
        });
        typedIpcRenderer.send("retryProxySetup")
    }

    // proxy state
    useEffect(() => {
        if (settingsStore.settings.internal.activeProxies === undefined) {
            if (import.meta.env.DEV) {
                useProxyState.setState({state: "waitingAction"})
            } else {
                useProxyState.setState({state: "pending"})
                setupProxy()
            }
        } else {
            useProxyState.setState({state: "success"})
        }
    }, []);

    // event listeners
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

        settingsStore.addEventListener("update", () => {
            if (settingsStore.settings.internal.activeProxies) {
                useProxyState.setState({
                    state: "success"
                })
            }
        })

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
            open={proxyState.state === "waitingAction"}
            message="Proxy needs setup"
            severity="info"
            icon={<Button onClick={setupProxy}>Setup</Button>}
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
