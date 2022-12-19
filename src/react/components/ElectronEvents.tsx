import React, { useEffect, useState } from "react";

import isOnline from "is-online";
import { useHistory } from "react-router-dom";
import { useNetworkState } from "react-use";
import { typedIpcRenderer } from "typed-ipc";

import Notification from "./Notification";
import { Button } from "@mui/material";
import { settingsStore, useSettings } from "../electron-shared/settings";

interface ComponentProps {
}

// notistack

let ElectronEvents: React.FC<ComponentProps> = () => {
    const routerHistory = useHistory();
    const settings = useSettings()
    const [isSettingProxy, setIsSettingProxy] = useState(false)

    const navigatorNetworkStatus = useNetworkState();

    const isOffline = useState(false);

    useEffect(() => {
        isOnline().then(isOnline => isOffline[1](!isOnline));
    }, [navigatorNetworkStatus.online]);

    const setupProxy = async () => {
        setIsSettingProxy(true)
        await typedIpcRenderer.request("setupProxy")
        setIsSettingProxy(false)
    }

    // useEffect(() => {
    //     console.log("change proxies")
    // }, [settings.internal.activeProxies])

    // proxy state
    useEffect(() => {
        if (settings.internal.activeProxies === undefined) {
            if (import.meta.env.DEV) {
                void setupProxy()
            }
        }
    }, []);

    // event listeners
    useEffect(() => {
        typedIpcRenderer.addEventListener("openRoute", (_event, { url }) => {
            routerHistory.push(url);
        });

        return () => {
            typedIpcRenderer.removeAllListeners("openRoute");
            typedIpcRenderer.removeAllListeners("proxySetup");
        };
    }, []);

    return <>
        <Notification
            open={isSettingProxy}
            message="Warming up your proxy companions..."
            severity="info"
            icon={null}
            progress={true}
        />
        <Notification
            open={settings.internal.activeProxies === undefined && !isSettingProxy}
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
