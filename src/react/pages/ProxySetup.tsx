import React, { useCallback } from "react";

import { typedIpcRenderer } from "typed-ipc";

import { useReactiveVar } from "@apollo/client";
import { Button, CircularProgress, Typography } from "@material-ui/core";

import { proxySetupStateVar } from "../apolloLocalState";
import CenterContent from "../components/CenterContent";

interface ComponentProps {
}

let ProxySetupPage: React.FC<ComponentProps> = () => {
    const state = useReactiveVar(proxySetupStateVar);

    const retrySetup = useCallback(() => {
        typedIpcRenderer.send("retryProxySetup");
        proxySetupStateVar({
            state: "pending"
        });
    }, []);

    return <CenterContent>
        {
            state.state === "pending" ? <>
                <CircularProgress />
                <Typography color="textPrimary">Setting the best proxy...</Typography>
                <Typography color="textSecondary">(It might take a few minutes)</Typography>
            </> :
                state.state === "errored" ? <>
                    <Typography variant="h3">Setup Errored: {state.errorMessage}</Typography>
                    <Button onClick={retrySetup}>Retry</Button>
                </> : null
        }
    </CenterContent>;
};

export default ProxySetupPage;
