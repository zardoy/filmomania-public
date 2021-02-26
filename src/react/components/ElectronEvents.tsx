import React, { useEffect } from "react";

import { useHistory } from "react-router-dom";
import { typedIpcRenderer } from "typed-ipc";

import { appInitialSetupStatusVar, proxySetupStateVar } from "../apolloLocalState";

interface ComponentProps {
}

let ElectronEvents: React.FC<ComponentProps> = () => {
    const routerHistory = useHistory();

    useEffect(() => {
        typedIpcRenderer.addEventListener("openRoute", (_event, { url }) => {
            routerHistory.push(url);
        });

        void (async () => {
            const data = await typedIpcRenderer.request("appInit");
            if (data.isFirstLaunch) {
                appInitialSetupStatusVar({
                    status: "setupNeeded",
                    specs: data.specs
                });
            } else {
                appInitialSetupStatusVar({
                    status: "appReady"
                });
            }
        })();

        typedIpcRenderer.addEventListener("proxySetup", (_event, { success, errorMessage = "" }) => {
            if (success) {
                proxySetupStateVar({
                    state: "success"
                });
            } else {
                proxySetupStateVar({
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

    return null;
};

export default ElectronEvents;
