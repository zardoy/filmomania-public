import createStore from "zustand";

// export const currentSearchFilmsVar = makeVar<ParsedFilmInfo[]>([]);

type BasicState = {
    state: "waitingAction";
} | {
    state: "pending";
} | {
    state: "errored";
    errorMessage: string;
} | {
    state: "success";
};

// export const useProxyState = createStore<BasicState>(() => ({
//     state: "waitingAction"
// }));
