import createStore from "zustand";

import { FirstLaunchSpecs } from "./electron-shared/ipcSchema";

type InitialSetupStatus = {
    status: "pending";
} | {
    status: "setupNeeded";
    // if null - they're loading
    specs: FirstLaunchSpecs;
} | {
    status: "appReady";
};

export const useAppStatus = createStore<InitialSetupStatus>(() => ({
    status: "pending"
}));

export const useCurrentSearch = createStore(() => ({
    query: "",
}));

// export const currentSearchFilmsVar = makeVar<ParsedFilmInfo[]>([]);

type BasicState = {
    state: "pending";
} | {
    state: "errored";
    errorMessage: string;
} | {
    state: "success";
};

export const useProxyState = createStore<BasicState>(() => ({
    state: "pending"
}));
