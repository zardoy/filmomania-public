import React, { useEffect, useState } from "react";

import isOnline from "is-online";
import { useHistory } from "react-router-dom";
import { useNetworkState } from "react-use";
import { typedIpcRenderer } from "typed-ipc";

import Notification from "./Notification";
import { Button } from "@mui/material";
import { useSettings } from "../electron-shared/settings";
import { proxy, useSnapshot } from "valtio";
import { typedIpcRequest } from "../utils/ipc";

interface ComponentProps {
}

export const isSettingProxy = proxy({ value: false, })
export const setupAppProxy = async () => {
    isSettingProxy.value = true
    await typedIpcRequest.setupProxy()
    isSettingProxy.value = false
}

const notificationsStack = proxy({ value: [] as string[] })

window.onunhandledrejection = ({ reason }) => {
    notificationsStack.value.push(reason.message?.replace(/^Error invoking remote method /, ""))
}

const NotificationStack = () => {
    const { value: stack } = useSnapshot(notificationsStack,)

    return <>
        {stack.map((message, i) => <Notification key={i} open={true} severity='error' message={message} autoHide onClose={() => {
            notificationsStack.value.splice(i, 1)
        }} />)}
    </>
}

// notistack

let ElectronEvents: React.FC<ComponentProps> = () => {
    const { value: isSettingProxySnap } = useSnapshot(isSettingProxy)

    const routerHistory = useHistory();
    const settings = useSettings()

    const navigatorNetworkStatus = useNetworkState();

    const isOffline = useState(false);

    useEffect(() => {
        isOnline().then(isOnline => isOffline[1](!isOnline));
    }, [navigatorNetworkStatus.online]);

    // proxy state
    useEffect(() => {
        if (settings.internal.activeProxies === undefined && !import.meta.env.DEV) {
            void setupAppProxy()
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
            open={isSettingProxySnap}
            message="Warming up your proxy companions..."
            severity="info"
            icon={null}
            progress={true}
        />
        <Notification
            open={settings.internal.activeProxies === undefined && !isSettingProxySnap}
            message="Proxy needs setup"
            severity="info"
            icon={<Button onClick={setupAppProxy}>Setup</Button>}
        />
        <Notification
            open={isOffline[0]}
            message="No internet connection"
            severity="error"
        />
        <NotificationStack />
    </>;
};

export default ElectronEvents;
