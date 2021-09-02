import createStore from "zustand";

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
