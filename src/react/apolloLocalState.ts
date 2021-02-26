import { makeVar } from "@apollo/client";

import { FirstLaunchSpecs } from "./electron-shared/ipcSchema";
import { ParsedFilmInfo } from "./utils/search-engine";

interface GlobalFilmInfoCache {
    [filmId: string]: ParsedFilmInfo;
}

export const currentSearchFilmsVar = makeVar<ParsedFilmInfo[]>([]);

type InitialSetupStatus = {
    status: "pending";
} | {
    status: "setupNeeded";
    // if null - they're loading
    specs: FirstLaunchSpecs;
} | {
    status: "appReady";
};

export const appInitialSetupStatusVar = makeVar<InitialSetupStatus>({
    status: "pending"
});

type ProxySetupState = {
    state: "pending";
} | {
    state: "errored";
    errorMessage: string;
} | {
    state: "success";
};

export const proxySetupStateVar = makeVar<ProxySetupState>({
    state: "pending"
});
